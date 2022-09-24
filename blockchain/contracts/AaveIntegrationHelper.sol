// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "hardhat/console.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveIntegrationHelper {
    IPool public poolAddress;

    constructor(address _poolAddress) {
        poolAddress = IPool(_poolAddress);
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
        // IERC20(tokenAddress).transferFrom(
        //     msg.sender,
        //     address(this),
        //     totalCollateral
        // );
        // IERC20(tokenAddress).approve(address(poolAddress), totalCollateral);

        poolAddress.supply(collateralAddress, totalCollateral, user, 0);
        // poolAddress.setUserUseReserveAsCollateral(tokenAddress, true);
        poolAddress.borrow(tokenAddress, units, 2, 0, user);
    }

    /*
     The initial loan is first repaid
     Then a call to getUserAccountData is made to check if the user has any outstanding debt 
     if they do not the totalCollateral deposited is withdawn to pay the flash swap 
     but if the user has any outstanding debt the total collateral to be withdrawn is calculated
     based on the targetHealth parameter the user provides.
     @note - providing a target Health less than 1 will put your loan up for liquidation
   */
    function _repayAndWithdrawCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        address user,
        uint256 targetHealth
    ) public {
        // IERC20(tokenAddress).approve(address(poolAddress), units);
        poolAddress.repay(tokenAddress, units, 2, user);
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            uint256 currentLiquidationThreshold,
            ,

        ) = poolAddress.getUserAccountData(user);
        if (totalDebtBase <= 0) {
            poolAddress.withdraw(collateralAddress, totalCollateralBase, user);
        } else {
            uint256 withdrawAmount = calculateWithdraw(
                targetHealth,
                totalDebtBase,
                currentLiquidationThreshold
            );
            poolAddress.withdraw(collateralAddress, withdrawAmount, user);
        }
    }

    function getPoolAddress() public view {
        poolAddress.ADDRESSES_PROVIDER();
    }

    function getUserData(address user)
        public
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        (
            uint256 totalCollateral,
            uint256 totalDebt,
            uint256 availableBorrows,
            uint256 currentLiquidation,
            uint256 ltvM,
            uint256 healthFactorM
        ) = poolAddress.getUserAccountData(user);

        return (
            totalCollateral,
            totalDebt,
            availableBorrows,
            currentLiquidation,
            ltvM,
            healthFactorM
        );
    }

    // calculate the total collateral to be withdrawn by using the health factor given
    // the totalBorrow, liquidationThreshold are gotten from the getUserData call
    // @dev - it is assumed that the liquidationThreshold's value is a percentage hence division by 100
    // @dev - function derived from - https://docs.aave.com/developers/guides/liquidations#how-is-health-factor-calculated
    // assuming our the values are in ETH
    function calculateWithdraw(
        uint256 healthFactor,
        uint256 totalBorrow,
        uint256 liquidationThreshold
    ) public pure returns (uint256) {
        uint256 liquidationValue = liquidationThreshold / 100;
        uint256 totalCollateral = (healthFactor * totalBorrow) /
            liquidationValue;
        return totalCollateral;
    }
}
