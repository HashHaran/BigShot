// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.6;

import "hardhat/console.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveIntegrationHelper {
    IPool public poolAddress;

    // 0x1758d4e6f68166C4B2d9d0F049F33dEB399Daa1F - mumbai
    constructor(address _poolAddress) public {
        poolAddress = IPool(_poolAddress);
    }

    function depositToken(address tokenAddress, uint256 units, uint256 amount) public {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount)
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
        uint256 totalCollateral = flashCollateral + userCollateral ;
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
        poolAddress.getUserAccountData(address(this);
    }
}
