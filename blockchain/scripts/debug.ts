import { ethers } from "hardhat";
import { IPoolAddressesProvider } from "@aave/core-v3/types/IPoolAddressesProvider"
import {IPoolAddressesProvider__factory} from "@aave/core-v3/types/factories/IPoolAddressesProvider__factory"

const POOL_ADDRESSES_PROVIDER: string = "0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D"; //Aave Documentation

async function main() {
    const [user1, user2, user3, user4] = await (ethers as any).getSigners();

    const poolAddressesProvider: IPoolAddressesProvider = IPoolAddressesProvider__factory.connect(POOL_ADDRESSES_PROVIDER, user1);

    console.log(poolAddressesProvider.getPool());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
