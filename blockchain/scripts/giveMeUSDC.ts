import { ethers, network } from "hardhat";

const USDC: string = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"; //Ether Scan
const USDC_WHALE: string = "0xebe80f029b1c02862b9e8a70a7e5317c06f62cae"; //Ether Scan

async function main() {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [USDC_WHALE],
    });

    let whale = await ethers.getSigner(USDC_WHALE)
    let usdc = await ethers.getContractAt("IERC20", USDC)

    const [user1, user2, user3, user4] = await (ethers as any).getSigners();

    console.log("USDC balance of whale", await usdc.balanceOf(USDC_WHALE));

    const amount = 1e12;
    const tx = await usdc.connect(whale).transfer(user1.getAddress(), amount);
    await tx.wait();
    console.log("USDC balance of user 1", await usdc.balanceOf(user1.getAddress()));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
