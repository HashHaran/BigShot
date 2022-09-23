import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from 'ethers'

import { BigShot } from "../typechain-types/contracts/BigShot"
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20"
import { IERC20__factory } from "../typechain-types/factories/@openzeppelin/contracts/token/ERC20/IERC20__factory"
import {IPoolAddressesProvider} from "@aave/core-v3/types/IPoolAddressesProvider"
import { IPoolAddressesProvider__factory } from "@aave/core-v3/types/factories/IPoolAddressesProvider__factory"
import {IPool} from "@aave/core-v3/types/IPool"
import { IPool__factory } from "@aave/core-v3/types/factories/IPool__factory"

var fs = require('fs');

//CONFIG: GOERLI TEST NET ADDRESSES THAT WE WILL NEED AND OTHER CONFIGURATIONS
const USDC: string = "0x07865c6e87b9f70255377e024ace6630c1eaa37f"; //Google Search
const POOL_ADDRESSES_PROVIDER: string = "0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D"; //Aave Documentation
const WETH: string = "";
const WETH_USDC_RATE: number = 4000;
const WETH_USDC_RATE_CLOSE_SHORT: number = 3500;
const DESIRED_HEALTH_FACTOR_OF_SHORT: number = 1.5;
const USDC_COLLATERAL_LIQIDATION_THRESHOLD: number = 0.85;
const WETH_USDC_UNISWAP_POOL_FEE: number = 0.003;

describe("BigShot", function () {

    let user1: Wallet, user2: Wallet, user3: Wallet, user4: Wallet;
    let bigShot: BigShot;
    let usdc: IERC20;
    let weth: IERC20;
    let pool: IPool;

    async function bigShotPreDeployedFixture() {
        var bigShotAddress: {
            contractAddress: string;
        };
        bigShotAddress = { contractAddress: "PLACEHOLDER" };
        var data = fs.readFileSync('localContractAddress.json', 'utf8')
        bigShotAddress = JSON.parse(data);

        const BigShot = await ethers.getContractFactory("BigShot");
        const bigShot: BigShot = BigShot.attach(bigShotAddress.contractAddress);
        await bigShot.deployed();

        const usdc: IERC20 = IERC20__factory.connect(USDC, user1);
        const weth: IERC20 = IERC20__factory.connect(WETH, user1);

        const poolAddressesProvider: IPoolAddressesProvider = IPoolAddressesProvider__factory.connect(POOL_ADDRESSES_PROVIDER, user1);
        const poolAddress = await poolAddressesProvider.getPool();
        const pool: IPool = IPool__factory.connect(poolAddress, user1);

        //user needs to approve BigShot in both token and collateral
        usdc.approve(bigShot.address, usdc.totalSupply());
        weth.approve(bigShot.address, weth.totalSupply());

        //BigShot needs to approve AAVE in both token and collaterral
        usdc.connect(bigShot.address).approve(poolAddress, usdc.totalSupply());
        weth.connect(bigShot.address).approve(poolAddress, weth.totalSupply());

        return { bigShot, usdc, weth, pool };
    }

    before('create fixture loader', async () => {
        [user1, user2, user3, user4] = await (ethers as any).getSigners();
        ({ bigShot, usdc, weth, pool } = await bigShotPreDeployedFixture());
    });

    describe("Initiate Short Position", async () => {

        const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
        const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());

        const units = 1; //Shorting 1 ETH
        const totalCollateralRequired = units * DESIRED_HEALTH_FACTOR_OF_SHORT * WETH_USDC_RATE / USDC_COLLATERAL_LIQIDATION_THRESHOLD; //Health Factor = Collateral * Collateral Liquidation Threshold/Borrows
        const flashCollateral = units * WETH_USDC_RATE; //This is the current market rate of the WETH units I am borrowing. Which is same as what I can get from flash swap and repay using the borrowed funds
        const userCollateral = totalCollateralRequired - flashCollateral;
        const openShortPositionTx = await bigShot.connect(user1).openShortTokenPosition(WETH, units, USDC, WETH_USDC_UNISWAP_POOL_FEE, flashCollateral, userCollateral);
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
        console.log(await pool.getUserAccountData(await user1.getAddress()));
    })

    describe("Initiate Short Position", async () => {

        const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
        const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());

        const units = 1; //Closing 1 ETH short position
        const totalCollateralRequired = units * DESIRED_HEALTH_FACTOR_OF_SHORT * WETH_USDC_RATE / USDC_COLLATERAL_LIQIDATION_THRESHOLD; //Health Factor = Collateral * Collateral Liquidation Threshold/Borrows
        const flashCollateral = units * WETH_USDC_RATE; //This is the current market rate of the WETH units I am borrowing. Which is same as what I can get from flash swap and repay using the borrowed funds
        const userCollateral = totalCollateralRequired - flashCollateral;
        const closeShortPositionTx = await bigShot.connect(user1).closeShortTokenPosition(WETH, units, USDC, WETH_USDC_UNISWAP_POOL_FEE, -1); //Target health factor of -1 means withdraw the entire collateral amount
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
        console.log(await pool.getUserAccountData(await user1.getAddress()));
    })
});