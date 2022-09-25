import { ethers, network } from "hardhat";
var fs = require('fs');

let WETH9: string, UNISWAP_FACTORY: string, AAVE_POOL: string, AAVE_ORACLE_ADDRESS: string, AAVE_AUSDC_ADDRESS: string;
const NETWORK = "optimism";
//CONFIG: Wrapped ETH address and Uniswap Factory address of Optimism Main net. Intended to be used for testing with fork
if (NETWORK === "optimism") {
  WETH9 = "0x4200000000000000000000000000000000000006"; //Ether Scan
  UNISWAP_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; //Uniswap Docs
  AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs
  AAVE_ORACLE_ADDRESS = "0xD81eb3728a631871a7eBBaD631b5f424909f0c77"; //AAve Docs
  AAVE_AUSDC_ADDRESS = "0x625E7708f30cA75bfd92586e17077590C60eb4cD"; //AAve Docs
} else if (NETWORK === "polygon") {
  WETH9 = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; //Ether Scan
  UNISWAP_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; //Uniswap Docs
  AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs
  AAVE_ORACLE_ADDRESS = "0xb023e699F5a33916Ea823A16485e259257cA8Bd1"; //AAve Docs
  AAVE_AUSDC_ADDRESS = "0x625E7708f30cA75bfd92586e17077590C60eb4cD"; //AAve Docs
} else {
  throw new Error("Chain addresses not present!");
}

async function main() {
  const BigShot = await ethers.getContractFactory("BigShot");
  const bigShot = await BigShot.deploy(UNISWAP_FACTORY, WETH9, AAVE_POOL, AAVE_ORACLE_ADDRESS, AAVE_AUSDC_ADDRESS);

  await bigShot.deployed();

  var bigShotAddress = {
    contractAddress: bigShot.address
  };
  var json = JSON.stringify(bigShotAddress);
  const callback = () => {

  }

  fs.writeFile('localContractAddress.json', json, 'utf8', callback);

  console.log("BigShot contract deployed to:", bigShot.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
