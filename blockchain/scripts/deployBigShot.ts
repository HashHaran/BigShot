import { ethers } from "hardhat";
var fs = require('fs');

//CONFIG: Wrapped ETH address and Uniswap Factory address of Optimism Main net. Intended to be used for testing with fork
const WETH9 = "0x4200000000000000000000000000000000000006"; //Ether Scan
const UNISWAP_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; //Uniswap Docs
const AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; //Aave docs

async function main() {
    const BigShot = await ethers.getContractFactory("BigShot");
    const bigShot = await BigShot.deploy(UNISWAP_FACTORY, WETH9, AAVE_POOL);
  
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
