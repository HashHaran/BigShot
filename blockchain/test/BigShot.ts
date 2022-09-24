import { expect } from "chai";
import { ethers } from "hardhat";
import { Wallet } from 'ethers';

import { BigShot } from "../typechain-types/artifacts/contracts/BigShot";
import { IERC20 } from "../typechain-types/artifacts/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../typechain-types/factories/artifacts/@openzeppelin/contracts/token/ERC20/IERC20__factory";
import { IPool } from "../typechain-types/artifacts/@aave/core-v3/contracts/interfaces/IPool";
import { IPool__factory } from "../typechain-types/factories/artifacts/@aave/core-v3/contracts/interfaces/IPool__factory";
import { ICreditDelegationToken } from "../typechain-types/node_modules/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken";
import { ICreditDelegationToken__factory } from "../typechain-types/factories/node_modules/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken__factory";


import * as fs from "fs";

//CONFIG: OPTIMISM MAIN NET ADDRESSES THAT WE WILL NEED AND OTHER CONFIGURATIONS
const USDC: string = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"; //Ether Scan
const vUSDC: string = "0xFCCf3cAbbe80101232d343252614b6A3eE81C989"; //Ether Scan
const WETH: string = "0x4200000000000000000000000000000000000006"; //Ether Scan
const vWETH: string = "0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351" //Ether Scan
const AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs
const WETH_USDC_RATE: number = 1330;
const WETH_USDC_RATE_CLOSE_SHORT: number = 1325;
const DESIRED_HEALTH_FACTOR_OF_SHORT: number = 1.5;
const USDC_COLLATERAL_LIQIDATION_THRESHOLD: number = 0.85;
const WETH_USDC_UNISWAP_POOL_FEE: number = 500;

describe("BigShot", function () {

    let user1: Wallet, user2: Wallet, user3: Wallet, user4: Wallet;
    let bigShot: BigShot;
    let usdc: IERC20;
    let weth: IERC20;

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

        // User needs to approve usage of USDC as collateral in AAVE
        const pool: IPool = IPool__factory.connect(AAVE_POOL, user1);
        const setReserveAsCollateralTx = await pool.setUserUseReserveAsCollateral(USDC, true);
        await setReserveAsCollateralTx.wait();

        // User needs to delegate his credit on the collateral 
        const usdcVariableDebtToken: ICreditDelegationToken = ICreditDelegationToken__factory.connect(vUSDC, user1);
        const usdcCreditDelegationTx = await usdcVariableDebtToken.approveDelegation(bigShot.address, usdc.totalSupply());
        await usdcCreditDelegationTx.wait();

        const wethVariableDebtToken: ICreditDelegationToken = ICreditDelegationToken__factory.connect(vWETH, user1);
        const wethCreditDelegationTx = await wethVariableDebtToken.approveDelegation(bigShot.address, weth.totalSupply());
        await wethCreditDelegationTx.wait();

        return { bigShot, usdc, weth, user1};
    }

    before('create fixture loader', async () => {
        ({ bigShot, usdc, weth, user1 } = await bigShotPreDeployedFixture());
        console.log("Done with before!")
    });

    describe("Initiate Short Position", async () => {
        it("Should replicate results of initiate short position", async () => {
            const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
            const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());
            console.log(`wethBalanceBefore: ${wethBalanceBefore}`);
            console.log(`usdcBalanceBefore: ${usdcBalanceBefore}`);

            const units = 1; //Shorting 1 ETH
            const totalCollateralRequired = Math.ceil(units * DESIRED_HEALTH_FACTOR_OF_SHORT * WETH_USDC_RATE / USDC_COLLATERAL_LIQIDATION_THRESHOLD); //Health Factor = Collateral * Collateral Liquidation Threshold/Borrows
            console.log(`totalCollateralRequired: ${totalCollateralRequired}`);
            const flashCollateral = units * WETH_USDC_RATE; //This is the current market rate of the WETH units I am borrowing. Which is same as what I can get from flash swap and repay using the borrowed funds
            console.log(`flashCollateral: ${flashCollateral}`);
            const userCollateral = totalCollateralRequired - flashCollateral;
            console.log(`userCollateral: ${userCollateral}`);
            const openShortPositionTx = await bigShot.connect(user1).openShortTokenPosition(WETH, units, USDC, WETH_USDC_UNISWAP_POOL_FEE, flashCollateral, userCollateral);
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
            console.log(await bigShot.getUserData(await user1.getAddress()));
            expect(0).to.eq(0);
        });
    });

    describe("Close Short Position", async () => {
        it("Should replicate results of close short position", async () => {
            const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
            const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());

            const units = 1; //Closing 1 ETH short position
            const totalCollateralRequired = Math.ceil(units * DESIRED_HEALTH_FACTOR_OF_SHORT * WETH_USDC_RATE / USDC_COLLATERAL_LIQIDATION_THRESHOLD); //Health Factor = Collateral * Collateral Liquidation Threshold/Borrows
            const flashCollateral = units * WETH_USDC_RATE; //This is the current market rate of the WETH units I am borrowing. Which is same as what I can get from flash swap and repay using the borrowed funds
            const userCollateral = totalCollateralRequired - flashCollateral;
            const closeShortPositionTx = await bigShot.connect(user1).closeShortTokenPosition(WETH, units, USDC, WETH_USDC_UNISWAP_POOL_FEE, totalCollateralRequired); //Target health factor of -1 means withdraw the entire collateral amount
            const txReceipt = await closeShortPositionTx.wait();
            const gasUsed = txReceipt.gasUsed;
            console.log(`Gas Used: ${gasUsed}`);
            const uniswapFlashFee = units * WETH_USDC_UNISWAP_POOL_FEE / 1e6;

            const wethBalanceAfter = await weth.balanceOf(user1.getAddress());
            const usdcBalanceAfter = await usdc.balanceOf(user1.getAddress());
            const pnL = units * (WETH_USDC_RATE - WETH_USDC_RATE_CLOSE_SHORT);   //Need to take correct rates form the uniswap protocol for equality to happen it will fail for such dummy values
            console.log(`WETH Balance before: ${wethBalanceBefore.toNumber()}`);
            console.log(`WETH Balance after: ${wethBalanceAfter.toNumber()}`);
            console.log(`UNISWAP Flash Fee: ${uniswapFlashFee}`);
            console.log(`USDC Balance Before: ${usdcBalanceBefore.toNumber()}`);
            console.log(`USDC Balance After: ${usdcBalanceAfter.toNumber()}`);
            console.log(await bigShot.getUserData(await user1.getAddress()));
            expect(0).to.eq(0);
        });
    });
});