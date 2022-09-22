// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "hardhat/console.sol";

contract AaveIntegrationHelper {
    function _suppllyCollateralAndBorrow(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint256 flashCollateral,
        uint256 userCollateral,
        address user
    ) internal {}

    function _repayAndWithdrawCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        address user,
        uint256 targetHealthFactor
    ) internal {}
}
