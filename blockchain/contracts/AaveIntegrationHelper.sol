// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "hardhat/console.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPriceOracle} from "@aave/core-v3/contracts/interfaces/IPriceOracle.sol";

contract AaveIntegrationHelper {
    IPool public poolAddress;
    IPriceOracle public oracleAddress;

    constructor(address _poolAddress, address _oracleAddress) {
        poolAddress = IPool(_poolAddress);
        oracleAddress = IPriceOracle(_oracleAddress);
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
        uint256 userCollateral
    ) public {
        uint256 totalCollateral = flashCollateral + userCollateral;
        IERC20(collateralAddress).transferFrom(
            msg.sender,
            address(this),
            totalCollateral
        );
        IERC20(collateralAddress).approve(
            address(poolAddress),
            totalCollateral
        );

        poolAddress.supply(
            collateralAddress,
            totalCollateral,
            address(this),
            0
        );
        poolAddress.setUserUseReserveAsCollateral(collateralAddress, true);
        poolAddress.borrow(tokenToBorrow, units, 2, 0, address(this));
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
        IERC20(tokenBorrowed).approve(address(poolAddress), units);
        poolAddress.repay(tokenBorrowed, type(uint256).max, 2, user);
        (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            ,
            uint256 currentLiquidationThreshold,
            ,

        ) = poolAddress.getUserAccountData(address(this));
        if (totalDebtBase <= 0) {
            uint256 _getPrice = oracleAddress.getAssetPrice(collateralAddress);
            uint256 amountWithdraw = (totalCollateralBase / _getPrice) *
                1000000000000000000;
            poolAddress.withdraw(collateralAddress, amountWithdraw, user);
        } else {
            uint256 withdrawAmount = calculateWithdraw(
                targetHealth,
                totalDebtBase,
                currentLiquidationThreshold,
                collateralAddress
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
        uint256 liquidationThreshold,
        address collateralAddress
    ) public view returns (uint256) {
        uint256 liquidationValue = liquidationThreshold / 100;
        uint256 totalCollateral = (healthFactor * totalBorrow) /
            liquidationValue;
        uint256 _getPrice = oracleAddress.getAssetPrice(collateralAddress);
        uint256 _getAmount = totalCollateral / _getPrice;
        uint256 _total = _getAmount * 1000000000000000000;
        return _total;
    }

    function getPrice(address assest) public view returns (uint256) {
        uint256 _price = oracleAddress.getAssetPrice(assest);
        return _price;
    }
}
