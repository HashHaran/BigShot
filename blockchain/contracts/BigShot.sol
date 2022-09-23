// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {UniswapIntegrationHelper} from "./UniswapIntegrationHelper.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BigShot is UniswapIntegrationHelper {
    constructor(
        address _factory,
        address _WETH9,
        address _aavePoolAddress
    ) UniswapIntegrationHelper(_factory, _WETH9, _aavePoolAddress) {}

    function openShortTokenPosition(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 flashCollateral,
        uint256 userCollateral
    ) public {
        //Assuming the user has already approved Big Shot protocol to use his funds in the collateral contract. Big shot protocol will take care of
        //securing rest of collateral required via flash swap and supplying it to AAVE.
        IERC20(collateralAddress).transferFrom(
            msg.sender,
            address(this),
            userCollateral
        );
        _initiateShortPositionWithFlashSwapCollateral(
            tokenAddress,
            units,
            collateralAddress,
            uniswapPoolFee,
            flashCollateral,
            userCollateral
        );
    }

    function closeShortTokenPosition(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 targetHealthFactor
    ) public {
        _closeShortPositionWithFlashSwapCollateral(
            tokenAddress,
            units,
            collateralAddress,
            uniswapPoolFee,
            targetHealthFactor
        );
    }
}
