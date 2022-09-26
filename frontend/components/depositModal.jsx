import React, { useState } from "react";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import B_abi from "../../blockchain/artifacts/contracts/BigShot.sol/BigShot.json";
import Con_address from "../../blockchain/localContractAddress.json";

function DepositModal({
  open,
  setOpen,
  tokenAddress,
  balance,
  token_logo,
  token_symbol,
  decimal,
}) {
  const [inputAmount, setInputAmount] = useState(0);
  const [leverage, setLeverage] = useState(1);
  //console.log(balance, token_logo, tokenAddress, token_symbol, decimal);
  const balanceA = (balance / 10 ** decimal).toFixed(3);
  const total = inputAmount * 2 * leverage;

  const contract_address = Con_address.contractAddress;
  const { config } = usePrepareContractWrite({
    addressOrName: contract_address,
    contractInterface: B_abi.abi,
    functionName: "openShortTokenPosition",
    args: [tokenAddress, ]
  });

  const { write, data, isError, isLoading } = useContractWrite(config);
  console.log(data)
  console.log(isError)
  return (
    <>
      {open ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-sm">
              <div className="border-0 rounded-lg shadow-sm flex flex-col w-fit bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between border-b border-solid border-slate-200 rounded-t">
                  <h3 className="text-2xl text-green-500 ml-10 mt-5 font-semibold">
                    Short Token
                  </h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setOpen(false)}
                  >
                    <span className="bg-transparent text-gray h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <div className="flex">
                    <div>
                      <div className="mt-5 flex-col">
                        <p className="text-xs text-gray ml-4"> Amount:</p>
                        <div className="flex">
                          <div className="flex-col">
                            <input
                              type="number"
                              value={inputAmount}
                              className="text-lg border ml-5 h-12 text-center rounded-sm shadow-sm"
                              id="input-amount"
                              onChange={(event) => {
                                setInputAmount(event.target.value);
                              }}
                            />
                          </div>
                          <div className="flex">
                            <img
                              className="ml-1 mr-1"
                              src={token_logo}
                              alt="crypto-logo"
                              height="20"
                              width="40"
                            />
                            <p className="mt-3 font-semibold text-sm">
                              {token_symbol}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          <button
                            onClick={() => setInputAmount(balanceA)}
                            className="text-xs bg-white ml-6 "
                          >
                            Max
                          </button>
                          <p className="text-xs ml-16 ">
                            Balance:{" "}
                            {((balance - inputAmount) / 10 ** decimal).toFixed(
                              3
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="">
                        <p className="text-gray mt-6 text-xs ml-5">Leverage</p>
                        <div className=" ml-5 flex">
                          <button
                            onClick={() => setLeverage(1)}
                            className={
                              leverage == 1
                                ? "px-6 bg-bubble-gum text-white font-semibold border-2"
                                : "px-6 bg-bubble-gum text-white font-semibold"
                            }
                          >
                            1x
                          </button>
                          <button
                            onClick={() => setLeverage(2)}
                            className={
                              leverage == 2
                                ? "px-6 bg-metal  text-white font-semibold border-2"
                                : "px-6 bg-metal  text-white font-semibold"
                            }
                          >
                            2x
                          </button>
                          <button
                            onClick={() => setLeverage(3)}
                            className={
                              leverage == 3
                                ? "px-6 bg-bermuda  text-white font-semibold border-2"
                                : "px-6 bg-bermuda  text-white font-semibold"
                            }
                          >
                            3x
                          </button>
                        </div>
                      </div>
                      <div className="mt-5">
                        <p className="text-sm">Transaction details</p>
                        <div className="border w-fit h-fit p-3">
                          <div className="flex">
                            <div className="ml-2">
                              <p className="text-sm">Total position size</p>
                              <p className="text-[8px]">(amount + leverage )</p>
                            </div>
                            <HiOutlineArrowNarrowRight className="mt-2 ml-5" />
                            <p className="mt-1 ml-8">{total}</p>
                          </div>
                        </div>
                      </div>

                      <button onClick={write} disabled={isLoading} className="bg-red mt-6 ml-20 rounded-lg p-1 px-4 w-fit text-white font-semibold">
                        short
                      </button>
                    </div>
                    <div></div>
                  </div>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}
export default DepositModal;
