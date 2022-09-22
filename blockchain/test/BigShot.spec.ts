import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from 'ethers'

import { BigShot } from "../typechain-types/contracts/BigShot"
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20"
import { IERC20__factory } from "../typechain-types/factories/@openzeppelin/contracts/token/ERC20/IERC20__factory"
import {IPoolAddressesProvider} from "@aave/core-v3/types/IPoolAddressesProvider"
import {IPoolAddressesProvider__factory} from "@aave/core-v3/types/factories/IPoolAddressesProvider__factory"
var fs = require('fs');

//CONFIG: GOERLI TEST NET ADDRESSES THAT WE WILL NEED AND OTHER CONFIGURATIONS
const USDC: string = "0x07865c6e87b9f70255377e024ace6630c1eaa37f"; //Google Search
const POOL_ADDRESSES_PROVIDER: string = "0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D"; //Aave Documentation

describe("BigShot", function () {

    let user1: Wallet, user2: Wallet, user3: Wallet, user4: Wallet;
    let bigShot: BigShot;
    let usdc: IERC20;

    async function bigShotPreDeployedFixture() {
        var bigShotAddress: {
            contractAddress: string;
        };
        bigShotAddress = { contractAddress: "PLACEHOLDER" };
        var data = fs.readFileSync('localContractAddress.json', 'utf8')
        bigShotAddress = JSON.parse(data);

        const BigShot = await ethers.getContractFactory("BigShot");
        const bigShot: BigShot = BigShot.attach(bigShotAddress.contractAddress);

        const usdc: IERC20 = IERC20__factory.connect(USDC, user1);

        const poolAddressesProvider: IPoolAddressesProvider = IPoolAddressesProvider__factory.connect(POOL_ADDRESSES_PROVIDER, user1);

        return { bigShot, usdc, poolAddressesProvider };
    }

    before('create fixture loader', async () => {
        [user1, user2, user3, user4] = await (ethers as any).getSigners();
        ({ bigShot, usdc } = await bigShotPreDeployedFixture());
    });

    describe("Initiate Short Position with more than enough collateral", async () => {

    })
});