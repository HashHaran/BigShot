import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'

import * as dotenv from "dotenv";
dotenv.config();

const GOERLI_API_URL: string | undefined = process.env.GOERLI_API_URL;
const OPTIMISM_GOERLI_API_URL: string | undefined = process.env.OPTIMISM_GOERLI_API_URL;
const POLYGON_MUMBAI_API_URL: string | undefined = process.env.POLYGON_MUMBAI_API_URL;
const OPTIMISM_MAINNET_API_URL: string | undefined = process.env.OPTIMISM_MAINNET_API_URL;
const POLYGON_MAINNET_API_URL: string | undefined = process.env.POLYGON_MAINNET_API_URL;

const PRIVATE_KEY1: string | undefined = process.env.PRIVATE_KEY1;
const PRIVATE_KEY2: string | undefined = process.env.PRIVATE_KEY2;
const PRIVATE_KEY3: string | undefined = process.env.PRIVATE_KEY3;
const PRIVATE_KEY4: string | undefined = process.env.PRIVATE_KEY4;
const TEST_PRIVATE_KEY1: string | undefined = process.env.TEST_PRIVATE_KEY1;
const TEST_PRIVATE_KEY2: string | undefined = process.env.TEST_PRIVATE_KEY2;
const TEST_PRIVATE_KEY3: string | undefined = process.env.TEST_PRIVATE_KEY3;
const TEST_PRIVATE_KEY4: string | undefined = process.env.TEST_PRIVATE_KEY4;

if (!GOERLI_API_URL || !PRIVATE_KEY1 || !PRIVATE_KEY2 || !PRIVATE_KEY3 || !PRIVATE_KEY4) {
  throw new Error("Please set your API_URL and PRIVATE_KEYs in a .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6"
      },
      {
        version: "0.8.0"
      },
      {
        version: "0.8.10"
      },
    ]
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false,
    externalArtifacts: ['node_modules/@aave/core-v3/artifacts/contracts/interfaces/ICreditDelegationToken.sol/ICreditDelegationToken.json'],
  },
  defaultNetwork: "fork",

  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: `0x${PRIVATE_KEY1}`,
          balance: "10000000000000000000000"
        },
        {
          privateKey: `0x${PRIVATE_KEY2}`,
          balance: "10000000000000000000000"
        },
        {
          privateKey: `0x${PRIVATE_KEY3}`,
          balance: "10000000000000000000000"
        },
        {
          privateKey: `0x${PRIVATE_KEY4}`,
          balance: "10000000000000000000000"
        }
      ]
    },
    fork: {
      url: "http://127.0.0.1:8545/",
      timeout: 100_000
      // accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
    goerli: {
      url: GOERLI_API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
    optimism_goerli: {
      url: OPTIMISM_GOERLI_API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
    polygon_mumbai: {
      url: POLYGON_MUMBAI_API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
    optimism_mainnet: {
      url: OPTIMISM_MAINNET_API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
    polygon_mainnet: {
      url: POLYGON_MAINNET_API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    },
  },
  mocha: {
    parallel: false,
    timeout: 800000
  }
};

export default config;
