import { expect } from "chai";
import { ethers } from "hardhat";
import { Wallet } from 'ethers';

import { BigShot } from "../typechain-types/artifacts/contracts/BigShot";
import { IERC20 } from "../typechain-types/artifacts/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../typechain-types/factories/artifacts/@openzeppelin/contracts/token/ERC20/IERC20__factory";
import { IPool } from "../typechain-types/artifacts/@aave/core-v3/contracts/interfaces/IPool";
import { IPool__factory } from "../typechain-types/factories/artifacts/@aave/core-v3/contracts/interfaces/IPool__factory";
import { ICreditDelegationToken } from "../typechain-types/external/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken";
import { ICreditDelegationToken__factory } from "../typechain-types/factories/external/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken__factory";


import * as fs from "fs";

let USDC: string, vUSDC: string, aUSDC: string, USDC_NUM_DECIMALS: number, WETH: string, vWETH: string, WETH_NUM_DECIMALS: number, AAVE_POOL: string;
const NETWORK = "optimism";
//CONFIG: OPTIMISM MAIN NET ADDRESSES THAT WE WILL NEED AND OTHER CONFIGURATIONS
if (NETWORK === "optimism") {
    USDC = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"; //Ether Scan
    vUSDC = "0xFCCf3cAbbe80101232d343252614b6A3eE81C989"; //Ether Scan
    aUSDC = "0x625E7708f30cA75bfd92586e17077590C60eb4cD"; //Ether Scan
    USDC_NUM_DECIMALS = 6; //Ether Scan
    WETH = "0x4200000000000000000000000000000000000006"; //Ether Scan
    vWETH = "0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351" //Ether Scan
    WETH_NUM_DECIMALS = 18 //Ether Scan
    AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs
} else if (NETWORK === "polygon") {
    USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; //Ether Scan
    vUSDC = "0xFCCf3cAbbe80101232d343252614b6A3eE81C989"; //Ether Scan
    aUSDC = "0x625E7708f30cA75bfd92586e17077590C60eb4cD"; //Ether Scan
    USDC_NUM_DECIMALS = 6; //Ether Scan
    WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; //Ether Scan
    vWETH = "0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351" //Ether Scan
    WETH_NUM_DECIMALS = 18 //Ether Scan
    AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs
} else {
    throw new Error("Addresses not available for chain");
}

const WETH_USDC_RATE: number = 1340 * 10 ** USDC_NUM_DECIMALS / 10 ** WETH_NUM_DECIMALS;
const WETH_USDC_RATE_CLOSE_SHORT: number = 1325;
const DESIRED_HEALTH_FACTOR_OF_SHORT: number = 1.5;
const USDC_COLLATERAL_LIQIDATION_THRESHOLD: number = 0.85;
const WETH_USDC_UNISWAP_POOL_FEE: number = 500;

describe("BigShot", function () {

    let user1: Wallet, user2: Wallet, user3: Wallet, user4: Wallet;
    let bigShot: BigShot;
    let usdc: IERC20;
    let weth: IERC20;
    let aUsdc: IERC20;

    async function bigShotPreDeployedFixture() {
        var bigShotAddress: {
            contractAddress: string;
        };
        bigShotAddress = { contractAddress: "PLACEHOLDER" };
        var data = fs.readFileSync('localContractAddress.json', 'utf8')
        bigShotAddress = JSON.parse(data);

        const BigShot = await ethers.getContractFactory("BigShot");
        const bigShot: BigShot = BigShot.attach(bigShotAddress.contractAddress);
        console.log("BigShot instance obtained!");

        [user1, user2, user3, user4] = await (ethers as any).getSigners();

        // console.log(user1);

        const usdc: IERC20 = IERC20__factory.connect(USDC, user1);
        const weth: IERC20 = IERC20__factory.connect(WETH, user1);
        const aUsdc: IERC20 = IERC20__factory.connect(aUSDC, user1);
        console.log("usdc and weth instances created!");

        // const pool: IPool = IPool__factory.connect(poolAddress, user1);

        //user needs to approve BigShot in both token and collateral
        console.log("Starting usdc approval");
        const usdcApproveTx = await usdc.connect(user1).approve(bigShot.address, usdc.totalSupply());
        await usdcApproveTx.wait();
        console.log("Completed usdc approval");

        console.log("Starting weth approval");
        const wethApproveTx = await weth.connect(user1).approve(bigShot.address, weth.totalSupply());
        await wethApproveTx.wait();
        console.log("Completed weth approval");

        // BigShot needs to approve AAVE in both token and collaterral
        const usdcProApproveTx = await bigShot.connect(user1).approveToken(USDC, usdc.totalSupply());
        await usdcProApproveTx.wait();
        const wethProApproveTx = await bigShot.connect(user1).approveToken(WETH, weth.totalSupply());
        await wethProApproveTx.wait();

        //User needs to approve aave pool in both cryptos
        console.log("Starting usdc approval");
        const usdcApprovePoolTx = await usdc.connect(user1).approve(AAVE_POOL, usdc.totalSupply());
        await usdcApprovePoolTx.wait();
        console.log("Completed usdc approval");

        console.log("Starting weth approval");
        const wethApprovePoolTx = await weth.connect(user1).approve(AAVE_POOL, weth.totalSupply());
        await wethApprovePoolTx.wait();
        console.log("Completed weth approval");

        // User needs to approve usage of USDC as collateral in AAVE
        console.log("Starting to set reserve as collateral")
        const pool: IPool = IPool__factory.connect(AAVE_POOL, user1);
        const supplyOneUsdcTx = await pool.supply(USDC, 1 * 10 ** USDC_NUM_DECIMALS, user1.getAddress(), 0);
        await supplyOneUsdcTx.wait();
        const setReserveAsCollateralTx = await pool.setUserUseReserveAsCollateral(USDC, true);
        await setReserveAsCollateralTx.wait();
        console.log("Completed set reserve as collateral")

        // User needs to delegate his credit on the collateral 
        const usdcVariableDebtToken: ICreditDelegationToken = ICreditDelegationToken__factory.connect(vUSDC, user1);
        const usdcCreditDelegationTx = await usdcVariableDebtToken.approveDelegation(bigShot.address, usdc.totalSupply());
        await usdcCreditDelegationTx.wait();

        const wethVariableDebtToken: ICreditDelegationToken = ICreditDelegationToken__factory.connect(vWETH, user1);
        const wethCreditDelegationTx = await wethVariableDebtToken.approveDelegation(bigShot.address, weth.totalSupply());
        await wethCreditDelegationTx.wait();

        return { bigShot, usdc, aUsdc, weth, user1 };
    }

    before('create fixture loader', async () => {
        ({ bigShot, usdc, aUsdc, weth, user1 } = await bigShotPreDeployedFixture());
        console.log("Done with before!")
    });

    describe("Initiate and Close Short Position", async () => {
        it("Should replicate results of initiate short position", async () => {
            const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
            const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());
            console.log(`wethBalanceBefore: ${wethBalanceBefore}`);
            console.log(`usdcBalanceBefore: ${usdcBalanceBefore}`);
            console.log(`AAVE User1 data before:`, await bigShot.getUserData(await user1.getAddress()));
            console.log(`AAVE Protocol data before:`, await bigShot.getUserData(bigShot.address));

            const units = 1; //Shorting 1 ETH
            const unitsDecimals = units * 10 ** WETH_NUM_DECIMALS;
            const totalCollateralRequired = Math.ceil(unitsDecimals * DESIRED_HEALTH_FACTOR_OF_SHORT * WETH_USDC_RATE / USDC_COLLATERAL_LIQIDATION_THRESHOLD); //Health Factor = Collateral * Collateral Liquidation Threshold/Borrows
            console.log(`totalCollateralRequired: ${totalCollateralRequired}`);
            const flashCollateral = unitsDecimals * WETH_USDC_RATE; //This is the current market rate of the WETH units I am borrowing. Which is same as what I can get from flash swap and repay using the borrowed funds
            console.log(`flashCollateral: ${flashCollateral}`);
            const userCollateral = totalCollateralRequired - flashCollateral;
            console.log(`userCollateral: ${userCollateral}`);
            const openShortPositionTx = await bigShot.openShortTokenPosition(WETH, USDC, WETH_USDC_UNISWAP_POOL_FEE, flashCollateral, userCollateral);
            console.log(`Short Position call made!`)
            const txReceipt = await openShortPositionTx.wait();
            const gasUsed = txReceipt.gasUsed;
            console.log(`Gas Used: ${gasUsed}`);
            const uniswapFlashFee = flashCollateral * WETH_USDC_UNISWAP_POOL_FEE / 1e6;

            const wethBalanceAfter = await weth.balanceOf(user1.getAddress());
            const usdcBalanceAfter = await usdc.balanceOf(user1.getAddress());

            console.log(`WETH Balance before: ${wethBalanceBefore.toNumber()}`);
            console.log(`WETH Balance after: ${wethBalanceAfter.toNumber()}`);
            console.log(`USDC Balance Before: ${usdcBalanceBefore.toNumber()}`);
            console.log(`USDC Balance After: ${usdcBalanceAfter.toNumber()}`);
            console.log(`User Collateral: ${userCollateral}`);
            console.log(`UNISWAP Flash Fee: ${uniswapFlashFee}`);
            console.log(`AAVE User data after:`, await bigShot.getUserData(await user1.getAddress()));
            console.log(`AAVE Protocol data after:`, await bigShot.getUserData(bigShot.address));
            expect(0).to.eq(0);
        });

        it("Should replicate results of close short position", async () => {
            const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
            const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());
            console.log(`wethBalanceBefore: ${wethBalanceBefore}`);
            console.log(`usdcBalanceBefore: ${usdcBalanceBefore}`);
            console.log(`AAVE User1 data before:`, await bigShot.getUserData(await user1.getAddress()));
            console.log(`AAVE Protocol data before:`, await bigShot.getUserData(bigShot.address));

            //User needs to approve aTokens to Big Shot
            const aUsdcApproveTx = await aUsdc.approve(bigShot.address, await aUsdc.totalSupply());
            await aUsdcApproveTx.wait();

            const units = 1; //Closing 1 ETH short position
            const unitsDecimals = units * 10 ** WETH_NUM_DECIMALS;
            const closeShortPositionTx = await bigShot.connect(user1).closeShortTokenPosition(WETH, "1096948989905935532", USDC, WETH_USDC_UNISWAP_POOL_FEE, "2148728044072090220"); //Target health factor of -1 means withdraw the entire collateral amount
            const txReceipt = await closeShortPositionTx.wait();
            const gasUsed = txReceipt.gasUsed;
            console.log(`Gas Used: ${gasUsed}`);
            const uniswapFlashFee = unitsDecimals * WETH_USDC_UNISWAP_POOL_FEE / 1e6;

            const wethBalanceAfter = await weth.balanceOf(user1.getAddress());
            const usdcBalanceAfter = await usdc.balanceOf(user1.getAddress());

            console.log(`WETH Balance before: ${wethBalanceBefore.toNumber()}`);
            console.log(`WETH Balance after: ${wethBalanceAfter.toNumber()}`);
            console.log(`USDC Balance Before: ${usdcBalanceBefore.toNumber()}`);
            console.log(`USDC Balance After: ${usdcBalanceAfter.toNumber()}`);
            console.log(`UNISWAP Flash Fee: ${uniswapFlashFee}`);
            console.log(`AAVE User data after:`, await bigShot.getUserData(await user1.getAddress()));
            console.log(`AAVE Protocol data after:`, await bigShot.getUserData(bigShot.address));
            expect(0).to.eq(0);
        });
    });
});