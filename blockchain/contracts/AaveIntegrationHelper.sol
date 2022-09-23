// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "hardhat/console.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveIntegrationHelper {
    ILendingPool public poolAddress;

    //0x794a61358D6845594F94dc1DB02A252b5b4814aD -polygon mainnet
    // 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9 --eth mainnet

    // 0x9198F13B08E299d85E096929fA9781A1E3d5d827 -- mumbai
    constructor(address _poolAddress) public {
        poolAddress = ILendingPool(_poolAddress);
    }

    function depositToken(
        address tokenAddress,
        uint256 units,
        uint256 amount
    ) public {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(poolAddress), amount);
        poolAddress.deposit(tokenAddress, units, address(this), 0);
    }

    function withdrawToken(address tokenAddress, uint256 totalAmount) public {
        poolAddress.withdraw(tokenAddress, totalAmount, msg.sender);
    }

    function _suppllyCollateralAndBorrow(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint256 flashCollateral,
        uint256 userCollateral,
        address user
    ) public {
        uint256 totalCollateral = flashCollateral + userCollateral;
        poolAddress.deposit(tokenAddress, totalCollateral, user, 0);
        poolAddress.setUserUseReserveAsCollateral(tokenAddress, true);
        poolAddress.borrow(collateralAddress, units, 2, 0, user);
    }

    function _repayAndWithdrawCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        address user,
        uint256 totalAmount
    ) public {
        poolAddress.repay(collateralAddress, units, 2, user);
        poolAddress.withdraw(tokenAddress, totalAmount, user);
    }

    function getPoolAddressProvider() public view {
        poolAddress.ADDRESSES_PROVIDER();
    }

    function getUserData() public view {
        poolAddress.getUserAccountData(address(this));
    }
}
