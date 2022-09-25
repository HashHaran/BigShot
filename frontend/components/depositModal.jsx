import React, { useState } from "react";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

function DepositModal({ open, setOpen }) {
  return (
    <>
      {open ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-sm">
              <div className="border-0 rounded-lg shadow-sm relative flex flex-col w-fit bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between border-b border-solid border-slate-200  rounded-t">
                  <h3 className="text-2xl text-green-500 ml-20 mt-2 font-semibold">
                    Open Short Position
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
                              className="text-lg border ml-5 h-12 text-center rounded-sm shadow-sm"
                              id="address"
                            />
                          </div>
                          <div className="flex">
                            <img
                              src="https://t3.ftcdn.net/jpg/04/40/40/64/360_F_440406469_l7tqWxUWXMgJr0ZRad3K6L689mpM0Gdc.jpg"
                              alt="crypto-logo"
                              height="30"
                              width="40"
                            />
                            <p className="mt-3">Link</p>
                          </div>
                        </div>
                        <div className="flex">
                          <button className="text-xs bg-white ml-6 ">
                            Max
                          </button>
                          <p className="text-xs ml-16 ">Balance: 920.000</p>
                        </div>
                      </div>
                      <div className="">
                        <p className="text-gray mt-6 text-xs ml-5">Leverage</p>
                        <div className=" ml-5 flex">
                          <button className="px-6 bg-bubble-gum text-white font-semibold">
                            1x
                          </button>
                          <button className="px-6 bg-metal  text-white font-semibold">
                            2x
                          </button>
                          <button className="px-6 bg-bermuda  text-white font-semibold">
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
                              <p className="text-[8px]">
                                (amount + leverage )
                              </p>
                            </div>
                            <HiOutlineArrowNarrowRight className="mt-2 ml-5"/>
                            <p className="mt-1 ml-8">920.000</p>
                          </div>
                        </div>
                      </div>

                      <button className="bg-red mt-6 ml-20 rounded-lg p-1 px-4 w-fit text-white font-semibold">
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
