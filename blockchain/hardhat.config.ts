import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
dotenv.config();

const API_URL: string | undefined = process.env.API_URL;
const PRIVATE_KEY1: string | undefined = process.env.PRIVATE_KEY1;
const PRIVATE_KEY2: string | undefined = process.env.PRIVATE_KEY2;
const PRIVATE_KEY3: string | undefined = process.env.PRIVATE_KEY3;
const PRIVATE_KEY4: string | undefined = process.env.PRIVATE_KEY4;

if (!API_URL || !PRIVATE_KEY1 || !PRIVATE_KEY2 || !PRIVATE_KEY3 || !PRIVATE_KEY4) {
  throw new Error("Please set your API_URL and PRIVATE_KEYs in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  defaultNetwork: "localhost",

  networks: {
    goerli: {
      url: API_URL,
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
    }
  }
};

export default config;
