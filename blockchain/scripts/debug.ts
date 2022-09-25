import { ethers } from "hardhat";
import { IPoolAddressesProvider } from "../typechain-types/artifacts/@aave/core-v3/contracts/interfaces/IPoolAddressesProvider";
import { IPoolAddressesProvider__factory } from "../typechain-types/factories/artifacts/@aave/core-v3/contracts/interfaces/IPoolAddressesProvider__factory";
import { IPriceOracleGetter } from "../typechain-types/artifacts/@aave/core-v3/contracts/interfaces/IPriceOracleGetter";
import { IPriceOracleGetter__factory } from "../typechain-types/factories/artifacts/@aave/core-v3/contracts/interfaces/IPriceOracleGetter__factory";

const POOL_ADDRESSES_PROVIDER: string = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"; //Aave Documentation
const AAVE_ORACLE_ADDRESS: string = "0xD81eb3728a631871a7eBBaD631b5f424909f0c77"; //Aave Documentation

async function main() {
  const [user1, user2, user3, user4] = await (ethers as any).getSigners();

  const poolAddressesProvider: IPoolAddressesProvider = IPoolAddressesProvider__factory.connect(POOL_ADDRESSES_PROVIDER, user1);

  console.log(await poolAddressesProvider.getPool());

  const priceOracleGetter: IPriceOracleGetter = IPriceOracleGetter__factory.connect(AAVE_ORACLE_ADDRESS, user1);

  console.log(await priceOracleGetter.BASE_CURRENCY());

  console.log(await priceOracleGetter.BASE_CURRENCY_UNIT());

  console.log(await priceOracleGetter.getAssetPrice("0x7F5c764cBc14f9669B88837ca1490cCa17c31607"));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
