// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import {UniswapIntegrationHelper} from "./UniswapIntegrationHelper.sol";

contract BigShot is UniswapIntegrationHelper {
    function shortToken(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 flashCollateral
    ) public {
        _initiateShortPositionWithFlashSwapCollateral(
            tokenAddress,
            units,
            collateralAddress,
            uniswapPoolFee,
            flashCollateral
        );
    }
}
