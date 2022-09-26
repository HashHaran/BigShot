import React, { useEffect, useState } from "react";
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from "@aave/contract-helpers";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import { useProvider, useAccount, useNetwork } from "wagmi";
import { deployedContracts } from "../constants/Helper_addresses";

const UserPosition = () => {
  const provider = useProvider();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [userData, setUserData] = useState([]);
  const [ltv, setLtv] = useState();
  const [cliuidationThreshold, setCliquidationThreshold] = useState();
  const [healthFactor, setHealthFactor] = useState();

  const uiPoolDataProviderAddress =
    deployedContracts[chain.id]["UiPoolDataProviderV3"];
  const uiIncentiveDataProviderAddress =
    deployedContracts[chain.id]["UiIncentiveDataProvider"];
  const PoolAddressProvider =
    deployedContracts[chain.id]["poolAddressesProvider"];
  let userReserveDataArray = [];

  const currentTimeUnix = Math.floor(Date.now() / 1000);
  const poolDataProviderContract = new UiPoolDataProvider({
    uiPoolDataProviderAddress,
    provider,
    chainId: chain,
  });

  const incentiveDataProviderContract = new UiIncentiveDataProvider({
    uiIncentiveDataProviderAddress,
    provider,
    chainId: chain,
  });

  const getValues = async (lendingPoolAddressProvider) => {
    const reserves = await poolDataProviderContract.getReservesHumanized({
      lendingPoolAddressProvider,
    });
    console.log(reserves);
    const reservesArray = reserves.reservesData;
    const baseCurrencyData = reserves.baseCurrencyData;

    // Object containing array or users aave positions and active eMode category
    // { userReserves, userEmodeCategoryId }
    const userReserves =
      await poolDataProviderContract.getUserReservesHumanized({
        lendingPoolAddressProvider,
        user: "0x9353cdb9598937a9a9dd1d792a4d822ee8415e8d",
      });
    console.log(userReserves);
    const userReservesArray = userReserves.userReserves;

    // Array of incentive tokens with price feed and emission APR
    const reserveIncentives =
      await incentiveDataProviderContract.getReservesIncentivesDataHumanized({
        lendingPoolAddressProvider,
      });

    console.log(reserveIncentives);

    // Dictionary of claimable user incentives
    const userIncentives =
      await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized(
        {
          lendingPoolAddressProvider,
          user: "0x9353cdb9598937a9a9dd1d792a4d822ee8415e8d",
        }
      );
    console.log(userIncentives);

    return { reservesArray, baseCurrencyData, userReservesArray, userReserves };
  };

  const getFormattedresult = async (PoolAddressProvider) => {
    const { reservesArray, baseCurrencyData, userReservesArray, userReserves } =
      await getValues(PoolAddressProvider);

    const formattedPoolReserves = formatReserves({
      reserves: reservesArray,
      currentTimeUnix,
      marketReferencePriceInUsd:
        baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      marketReferenceCurrencyDecimals:
        baseCurrencyData.marketReferenceCurrencyDecimals,
    });

    const userSummary = formatUserSummary({
      currentTimestamp: currentTimeUnix,
      marketReferencePriceInUsd:
        baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      marketReferenceCurrencyDecimals:
        baseCurrencyData.marketReferenceCurrencyDecimals,
      userReserves: userReservesArray,
      formattedReserves: formattedPoolReserves,
      userEmodeCategoryId: userReserves.userEmodeCategoryId,
    });
    console.log(userSummary.currentLoanToValue);
    setLtv(userSummary.currentLoanToValue);
    setCliquidationThreshold(userSummary.currentLiquidationThreshold);
    setHealthFactor(userSummary.healthFactor.slice(0, 5));
    //setUserData(userSummary);
    userSummary.userReservesData.forEach((reserveData) => {
      if (reserveData.totalBorrows > 0) {
        userReserveDataArray.push(reserveData);
      }
    });
    console.log(userReserveDataArray);
    setUserData(userReserveDataArray);
  };

  useEffect(() => {
    if (isConnected) {
      getFormattedresult(PoolAddressProvider);
    }
  }, []);

  return (
    <div>
      {userData.length > 0 && (
        <div className="bg-white w-5/12 h-fit ml-20 border-2 border-blue">
          <p className="text-black font-semibold m-5">Open short positions</p>
          <div className="flex mt-10">
            <p className="text-black ml-5 text-sm">Assests</p>
            <p className="text-black ml-6 text-xs">Amount shorted</p>
            <p className="text-black ml-10 text-xs">Variable APY</p>
            <p className="text-black ml-12 text-xs">Ltv</p>
            <p className="text-black ml-10 text-xs">Health Factor</p>
          </div>
          <hr></hr>

          <div>
            {userData.map((data, i) => (
              <div key={i}>
                <div className="flex">
                  <p className="ml-5 font-semibold mt-5">
                    {data.reserve.symbol}
                  </p>
                  <p className="ml-14 font-semibold mt-5 text-blue">
                    {data.totalBorrows.slice(0, 6)}
                  </p>
                  <p className="ml-14 font-semibold mt-5 text-blue">
                    {data.reserve.variableBorrowAPY.slice(0, 7)}
                  </p>
                  <p className="ml-12 font-semibold mt-5 text-blue">
                    {ltv * 100}%
                  </p>
                  <p className="ml-10 font-semibold mt-5 text-blue">
                    {healthFactor}
                  </p>
                  <button className="ml-16 bg-bermuda px-4 h-fit mt-3 font-semibold text-white">
                    close{" "}
                  </button>
                </div>
                <hr></hr>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPosition;
