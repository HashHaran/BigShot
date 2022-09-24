import React, {useState} from "react";


export default function DonateModal({open, setOpen}) {
  
  return (
    <>
      {open ? (
        <> 
          <div
            className="justify-center  items-center bg-transparent flex overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
          >
            <div className="relative w-auto my-6 mx-auto max-w-sm">
             
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-fit bg-white outline-none focus:outline-none">
           
                <div className="flex items-start justify-between rounded-t">
                  <h3 className="text-2xl text-green-500 ml-32 mt-2 font-semibold">
                    Payment
                  </h3>
                  <button
                    className="p-1 ml-auto  border-0 text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setOpen(false)}
                  > 
                    <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto">
                  <div className="flex">
                    <div>
                        <p className="text-sm mt-5">Select address , amount and click donate button to donate. Once the money is send it can’t be undone</p>
                        <div className="mt-5">
                            <label htmlFor="address">Address:</label> 
                            <input type="text" className=" text-md border ml-5 rounded-lg shadow-md " id="address"/>
                        </div>
                        <div className="mt-5">
                            <label htmlFor="amount">Amount:</label> 
                            <input type="number" className=" text-center ml-5 border rounded-lg shadow-md" id="amount" />
                        </div>
                        <button className="bg-green-600 mt-6 ml-16 rounded-lg p-1 pl-1 pr-1 w-fit text-white font-semibold">Donate</button>
                       
                    </div>
                    <div>

                    </div>
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