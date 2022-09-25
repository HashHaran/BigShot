// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "hardhat/console.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IPriceOracleGetter} from "@aave/core-v3/contracts/interfaces/IPriceOracleGetter.sol";

contract AaveIntegrationHelper {
    IPool public poolAddress;
    IPriceOracleGetter public oracleAddress;
    IERC20 public aUsdc;

    constructor(
        address _poolAddress,
        address _oracleAddress,
        address _aaveAusdcTokenAddress
    ) {
        poolAddress = IPool(_poolAddress);
        oracleAddress = IPriceOracleGetter(_oracleAddress);
        aUsdc = IERC20(_aaveAusdcTokenAddress);
    }

    function depositToken(
        address tokenAddress,
        uint256 units,
        uint256 amount
    ) public {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(poolAddress), amount);
        poolAddress.supply(tokenAddress, units, address(this), 0);
    }

    function withdrawToken(address tokenAddress, uint256 totalAmount) public {
        poolAddress.withdraw(tokenAddress, totalAmount, msg.sender);
    }

    function _suppllyCollateralAndBorrow(
        address tokenToBorrow,
        uint256 units,
        address collateralAddress,
        uint256 flashCollateral,
        uint256 userCollateral,
        address user
    ) public {
        uint256 totalCollateral = flashCollateral + userCollateral;
        // IERC20(collateralAddress).transferFrom(
        //     msg.sender,
        //     address(this),
        //     totalCollateral
        // );
        // IERC20(collateralAddress).approve(
        //     address(poolAddress),
        //     totalCollateral
        // );

        poolAddress.supply(collateralAddress, totalCollateral, user, 0);
        // poolAddress.setUserUseReserveAsCollateral(collateralAddress, true);
        poolAddress.borrow(tokenToBorrow, units, 2, 0, user);
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
        address tokenBorrowed,
        uint256 units,
        address collateralAddress,
        address user,
        uint256 targetHealth
    ) public {
        // IERC20(tokenBorrowed).approve(address(poolAddress), units);
        console.log("User:");
        console.logAddress(user);
        poolAddress.repay(tokenBorrowed, units, 2, user);
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            uint256 currentLiquidationThreshold,
            ,

        ) = poolAddress.getUserAccountData(user);
        console.log("Total Debt Base:");
        console.logUint((totalDebtBase));
        if (totalDebtBase <= 0) {
            aUsdc.transferFrom(user, address(this), aUsdc.balanceOf(user));
            uint256 _getPrice = oracleAddress.getAssetPrice(collateralAddress);
            console.log("Collateral Asset Price from Oracle:");
            console.logUint(_getPrice);
            uint256 amountWithdraw = (totalCollateralBase *
                oracleAddress.BASE_CURRENCY_UNIT()) /
                ERC20(collateralAddress).decimals();
            console.log("Amount to withdraw:");
            console.logUint(amountWithdraw);
            poolAddress.withdraw(collateralAddress, type(uint256).max, user);
        } else {
            uint256 withdrawAmount = calculateWithdraw(
                targetHealth,
                totalCollateralBase,
                totalDebtBase,
                currentLiquidationThreshold,
                collateralAddress
            );
            poolAddress.withdraw(collateralAddress, withdrawAmount, user);
            console.log("User Balance after withdraw: ");
            console.logUint(IERC20(collateralAddress).balanceOf(user));
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
        uint256 totalCollateralBase,
        uint256 totalBorrowBase,
        uint256 liquidationThreshold,
        address collateralAddress
    ) public view returns (uint256) {
        uint256 liquidationValue = liquidationThreshold / 100;
        uint256 requiredCollateralBase = (healthFactor * totalBorrowBase) /
            liquidationValue;
        uint256 withdrawCollateralBase = totalCollateralBase -
            requiredCollateralBase;
        uint256 collateralBaseRate = oracleAddress.getAssetPrice(
            collateralAddress
        );
        uint256 withdrawCollateralNative = withdrawCollateralBase /
            collateralBaseRate;
        return withdrawCollateralNative;
    }

    function getPrice(address assest) public view returns (uint256) {
        uint256 _price = oracleAddress.getAssetPrice(assest);
        return _price;
    }
}
