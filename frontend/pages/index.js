import Head from "next/head";
import { WalletConnectButton } from "../components/wallet_connect";
import { useAccount, useNetwork } from "wagmi";
import { useEffect, useState } from "react";
import { BiCheck } from "react-icons/bi";
import { GrFormClose } from "react-icons/gr";
import DepositModal from "../components/depositModal";
import { ethers } from "ethers";
import UserPosition from "../components/userPosition";

export default function Home() {
  const [walletAssets, setWalletAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [con_address, setCon_address] = useState("");
  const [Tbalance, setTBalance] = useState(0);
  const [tokenLogo, setTokenLogo] = useState("");
  const [token_symbo, setToken_symbol] = useState("");
  const [tokenDecimal, setTokendecimal] = useState(0);

  const { address, isDisconnected, isConnected } = useAccount();
  const { chain } = useNetwork();

  const getValues = (tBalance, Taddress, Tlogo, Tsymbol, Tdecimal) => {
    setOpen(true);
    setCon_address(Taddress);
    setTBalance(tBalance);
    setTokenLogo(Tlogo);
    setToken_symbol(Tsymbol);
    setTokendecimal(Tdecimal);
  };
  const fetchAssets = async () => {
    const assests = await fetch(
      `https://api.covalenthq.com/v1/${chain.id}/address/${address}/portfolio_v2/?quote-currency=USD&format=JSON&key=${process.env.NEXT_PUBLIC_COVALENT_API_KEY}`
    );
    const response = await assests.json();
    const data = response.data.items;
    console.log(response.data.items);
    setWalletAssets(data);
  };
  useEffect(() => {
    if (isConnected) {
      fetchAssets();
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-violet via-light-blue to-fuchsia dark:bg-white  my-0">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-none">
        <div className="flex-row pt-5">
          <p className="ml-10 font-bold text-3xl text-silver">BIG SHOT</p>
          <div className="flex justify-end mb-10 pt-0">
            {isConnected && (
              <div className="h-fit w-fit ml-9/12 mr-10">
                <WalletConnectButton />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black w-9/12 h-64 ml-40 rounded-lg mb-10">
            <p className="text-center text-2xl font-bold py-5">About</p>
            <p className="mx-10 font-semibold text-md text-xl">
              Big Shot is a DeFi protocol that enables the user to hold
              <a
                className="text-gray"
                href="https://www.investopedia.com/terms/s/short.asp#:~:text=Shorting%20is%20a%20strategy%20used,short%20position%20is%20in%20place"
                target="blank"
              >
                {" "}
                short positions{" "}
              </a>{" "}
              on any ERC token. The protocol works by integrating with both AAVE
              and UNISWAP for the liquidity needs. Giving you the advantage deep
              pocketed pools to take humongous short positions.
            </p>

            <p className="mx-10 font-semibold text-md text-xl">
              It also provides leverage on the short position by employing Flash
              Swap.{" "}
            </p>
          </div>
          {isConnected ? (
            <div className="flex pb-56">
              {walletAssets.length > 0 && (
                <div className="bg-white w-5/12 h-fit ml-20 border-2 border-blue">
                  <p className="text-black font-semibold m-5">
                    Assests to Supply
                  </p>
                  <div className="flex mt-10">
                    <p className="text-black ml-10 text-xs">Assests</p>
                    <p className="text-black ml-20 text-xs">Balance</p>
                    <p className="text-black ml-14 text-xs">Price (USD)</p>
                    <p className="text-black text-xs  ml-10">Can be shorted</p>
                  </div>
                  <hr className="w-full"></hr>
                  {walletAssets.map((assest, i) => (
                    <div key={i} className="mt-1">
                      <div className="flex">
                        <img
                          className="ml-5 mt-5 mb-2"
                          src={
                            assest.logo_url ||
                            `https://t3.ftcdn.net/jpg/04/40/40/64/360_F_440406469_l7tqWxUWXMgJr0ZRad3K6L689mpM0Gdc.jpg`
                          }
                          alt={assest.contract_symbol}
                          height="30"
                          width="30"
                        />
                        
                          {assest.contract_ticker_symbol.length <= 8
                            ? <p className="text-black mt-6 ml-3 font-semibold mr-16">{assest.contract_ticker_symbol}</p>
                            : <p className="text-black mt-6 ml-3 font-semibold mr-6">{(assest.contract_ticker_symbol).slice(0,7)}...</p>}
                      
                        <p className="text-black mt-6 ">
                          {(
                            assest.holdings[0].close.balance /
                            10 ** assest.contract_decimals
                          ).toFixed(3)}
                        </p>
                        <p className="text-black mt-6 ml-16">
                          {assest.holdings[0].close.quote == null
                            ? "N/A"
                            : assest.holdings[0].close.quote}
                        </p>
                        {assest.holdings[0].close.quote == null ? (
                          <GrFormClose
                            className="ml-20 mt-5"
                            size={30}
                            
                          />
                        ) : (
                          <BiCheck
                            className="ml-20 mt-5"
                            size={30}
                            color="green"
                          />
                        )}
                        <button
                          disabled={
                            assest.holdings[0].close.quote == null
                              ? true
                              : false
                          }
                          onClick={() =>
                            getValues(
                              assest.holdings[0].close.balance,
                              assest.contract_address,
                              assest.logo_url,
                              assest.contract_ticker_symbol,
                              assest.contract_decimals
                            )
                          }
                          className={
                            assest.holdings[0].close.quote == null
                              ? "bg-gray w-fit h-fit p-1 px-2 font-semibold text-sm ml-10 text-white mt-5"
                              : `bg-red w-fit h-fit p-1 px-2 font-semibold text-sm ml-10 text-white mt-5`
                          }
                        >
                          short token
                        </button>
                        <DepositModal
                          open={open}
                          setOpen={setOpen}
                          tokenAddress={con_address}
                          balance={Tbalance}
                          token_logo={tokenLogo}
                          token_symbol={token_symbo}
                          decimal={tokenDecimal}
                        />
                      </div>
                      <hr className="w-full"></hr>
                    </div>
                  ))}
                </div>
              )}
              <UserPosition />
            </div>
          ) : (
            <div className="mt-20 pl-[600px] pb-80">
              <WalletConnectButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
