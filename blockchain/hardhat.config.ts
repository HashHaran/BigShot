import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
import { version } from "os";
dotenv.config();

const GOERLI_API_URL: string | undefined = process.env.GOERLI_API_URL;
const OPTIMISM_GOERLI_API_URL: string | undefined = process.env.OPTIMISM_GOERLI_API_URL;
const POLYGON_MUMBAI_API_URL: string | undefined = process.env.POLYGON_MUMBAI_API_URL;
const PRIVATE_KEY1: string | undefined = process.env.PRIVATE_KEY1;
const PRIVATE_KEY2: string | undefined = process.env.PRIVATE_KEY2;
const PRIVATE_KEY3: string | undefined = process.env.PRIVATE_KEY3;
const PRIVATE_KEY4: string | undefined = process.env.PRIVATE_KEY4;

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
  defaultNetwork: "fork",

  networks: {
    fork: {
      url: "http://127.0.0.1:8545/",
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
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
    }
  }
};

export default config;
