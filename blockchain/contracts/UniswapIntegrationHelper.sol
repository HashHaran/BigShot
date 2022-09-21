// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";

import "@uniswap/v3-periphery/contracts/base/PeripheryPayments.sol";
import "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "@uniswap/v3-periphery/contracts/libraries/CallbackValidation.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

import {AaveIntegrationHelper} from "./AaveIntegrationHelper.sol";

import "hardhat/console.sol";

contract UniswapIntegrationHelper is
    AaveIntegrationHelper,
    IUniswapV3FlashCallback,
    PeripheryPayments
{
    constructor(address _factory, address _WETH9)
        PeripheryImmutableState(_factory, _WETH9)
    {}

    function _initiateShortPositionWithFlashSwapCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 flashCollateral
    ) internal {
        address memory token0;
        address memory token1;
        uint256 memory amount0 = 0;
        uint256 memory amount1 = 0;

        if (tokenAddress < collateralAddress) {
            token0 = tokenAddress;
            token1 = collateralAddress;
            amount1 = flashCollateral;
        } else {
            token0 = collateralAddress;
            token1 = tokenAddress;
            amount0 = flashCollateral;
        }

        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: token0,
            token1: token1,
            fee: uniswapPoolFee
        });
        IUniswapV3Pool pool = IUniswapV3Pool(
            PoolAddress.computeAddress(factory, poolKey)
        );
        // recipient of borrowed amounts
        // amount of token0 requested to borrow
        // amount of token1 requested to borrow
        // need amount 0 and amount1 in callback to pay back pool
        // recipient of flash should be THIS contract
        pool.flash(
            address(this),
            amount0,
            amount1,
            abi.encode(
                FlashCallbackData({
                    amount0: amount0,
                    amount1: amount1,
                    payer: msg.sender,
                    poolKey: poolKey
                })
            )
        );
    }

    function _closeShortPositionWithFlashSwapCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress
    ) internal {}

    struct FlashCallbackData {
        uint256 amount0;
        uint256 amount1;
        address user;
        PoolAddress.PoolKey poolKey;
        bool isPositionInit;
    }

    /// @param fee0 The fee from calling flash for token0
    /// @param fee1 The fee from calling flash for token1
    /// @param data The data needed in the callback passed as FlashCallbackData from `initFlash`
    /// @notice implements the callback called from flash
    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override {}
}
