import { ethers } from "hardhat";
var fs = require('fs');

//CONFIG: Wrapped ETH address and Uniswap Factory address of mainnet. Intended to be used for testing with mainnet fork
const WETH9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const UNISWAP_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

async function main() {
    const BigShot = await ethers.getContractFactory("BigShot");
    const bigShot = await BigShot.deploy(UNISWAP_FACTORY, WETH9);
  
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
