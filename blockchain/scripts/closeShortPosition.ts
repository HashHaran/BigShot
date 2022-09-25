import { ethers, network } from "hardhat";
var fs = require('fs');
import { Wallet } from 'ethers';


import { BigShot } from "../typechain-types/artifacts/contracts/BigShot";
import { IERC20 } from "../typechain-types/artifacts/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../typechain-types/factories/artifacts/@openzeppelin/contracts/token/ERC20/IERC20__factory";
import { IPool } from "../typechain-types/artifacts/@aave/core-v3/contracts/interfaces/IPool";
import { IPool__factory } from "../typechain-types/factories/artifacts/@aave/core-v3/contracts/interfaces/IPool__factory";
import { ICreditDelegationToken } from "../typechain-types/external/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken";
import { ICreditDelegationToken__factory } from "../typechain-types/factories/external/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken__factory";

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

async function main() {

    let user1: Wallet, user2: Wallet, user3: Wallet, user4: Wallet;
    let bigShot: BigShot;
    let usdc: IERC20;
    let weth: IERC20;
    let aUsdc: IERC20;

    var bigShotAddress: {
        contractAddress: string;
    };
    bigShotAddress = { contractAddress: "PLACEHOLDER" };
    var data = fs.readFileSync('localContractAddress.json', 'utf8')
    bigShotAddress = JSON.parse(data);

    const BigShot = await ethers.getContractFactory("BigShot");
    bigShot = BigShot.attach(bigShotAddress.contractAddress);
    // console.log("BigShot instance obtained!");

    [user1, user2, user3, user4] = await (ethers as any).getSigners();

    // console.log(user1);

    usdc = IERC20__factory.connect(USDC, user1);
    weth = IERC20__factory.connect(WETH, user1);
    aUsdc = IERC20__factory.connect(aUSDC, user1);




    const wethBalanceBefore = await weth.balanceOf(user1.getAddress());
    const usdcBalanceBefore = await usdc.balanceOf(user1.getAddress());
    console.log(`WETH Balance Before: ${wethBalanceBefore}`);
    console.log(`USDC Balance Before: ${usdcBalanceBefore}`);
    console.log(`AAVE User1 data before:`, await bigShot.getUserData(await user1.getAddress()));
    console.log(`AAVE Protocol data before:`, await bigShot.getUserData(bigShot.address));

    const aUsdcApproveTx = await aUsdc.approve(bigShot.address, await aUsdc.totalSupply());
    await aUsdcApproveTx.wait();

    const units = 1; //Closing 1 ETH short position
    const unitsDecimals = units * 10 ** WETH_NUM_DECIMALS;
    const closeShortPositionTx = await bigShot.connect(user1).closeShortTokenPosition(WETH, "1096948989905935532", USDC, WETH_USDC_UNISWAP_POOL_FEE, "0"); //Target health factor of -1 means withdraw the entire collateral amount
    const txReceipt = await closeShortPositionTx.wait();
    const gasUsed = txReceipt.gasUsed;
    console.log(`Gas Used: ${gasUsed}`);
    // const uniswapFlashFee = unitsDecimals * WETH_USDC_UNISWAP_POOL_FEE / 1e6;

    const wethBalanceAfter = await weth.balanceOf(user1.getAddress());
    const usdcBalanceAfter = await usdc.balanceOf(user1.getAddress());

    console.log(`WETH Balance after: ${wethBalanceAfter.toNumber()}`);
    console.log(`USDC Balance After: ${usdcBalanceAfter.toNumber()}`);
    console.log(`AAVE User data after:`, await bigShot.getUserData(await user1.getAddress()));
    console.log(`AAVE Protocol data after:`, await bigShot.getUserData(bigShot.address));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});