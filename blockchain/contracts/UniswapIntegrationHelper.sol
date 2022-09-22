// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";

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
    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;

    constructor(address _factory, address _WETH9)
        PeripheryImmutableState(_factory, _WETH9)
    {}

    struct FlashCallbackData {
        uint256 amount0;
        uint256 amount1;
        address user;
        PoolAddress.PoolKey poolKey;
        bool isPositionInit;
        bool isToken0Collateral;
        uint256 units;
        uint256 flashCollateral;
        uint256 userCollateral;
        uint256 targetHealthFactor;
    }

    function _initiateShortPositionWithFlashSwapCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 flashCollateral,
        uint256 userCollateral
    ) internal {
        address token0;
        address token1;
        uint256 amount0 = 0;
        uint256 amount1 = 0;
        bool isToken0Collateral;

        if (tokenAddress < collateralAddress) {
            token0 = tokenAddress;
            token1 = collateralAddress;
            amount1 = flashCollateral;
            isToken0Collateral = false;
        } else {
            token0 = collateralAddress;
            token1 = tokenAddress;
            amount0 = flashCollateral;
            isToken0Collateral = true;
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
                    user: msg.sender,
                    poolKey: poolKey,
                    isPositionInit: true,
                    isToken0Collateral: isToken0Collateral,
                    units: units,
                    userCollateral: userCollateral,
                    flashCollateral: flashCollateral,
                    targetHealthFactor: 0
                })
            )
        );
    }

    function _closeShortPositionWithFlashSwapCollateral(
        address tokenAddress,
        uint256 units,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 targetHealthFactor
    ) internal {
        address token0;
        address token1;
        uint256 amount0 = 0;
        uint256 amount1 = 0;
        bool isToken0Collateral;

        if (tokenAddress < collateralAddress) {
            token0 = tokenAddress;
            token1 = collateralAddress;
            amount0 = units;
            isToken0Collateral = false;
        } else {
            token0 = collateralAddress;
            token1 = tokenAddress;
            amount1 = units;
            isToken0Collateral = true;
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
                    user: msg.sender,
                    poolKey: poolKey,
                    isPositionInit: true,
                    isToken0Collateral: isToken0Collateral,
                    units: units,
                    userCollateral: 0,
                    flashCollateral: 0,
                    targetHealthFactor: targetHealthFactor
                })
            )
        );
    }

    /// @param fee0 The fee from calling flash for token0
    /// @param fee1 The fee from calling flash for token1
    /// @param data The data needed in the callback passed as FlashCallbackData from `initFlash`
    /// @notice implements the callback called from flash
    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override {
        FlashCallbackData memory decodedCallBkData = abi.decode(
            data,
            (FlashCallbackData)
        );
        CallbackValidation.verifyCallback(factory, decodedCallBkData.poolKey);

        uint256 amount0Min = LowGasSafeMath.add(
            decodedCallBkData.amount0,
            fee0
        );
        uint256 amount1Min = LowGasSafeMath.add(
            decodedCallBkData.amount1,
            fee1
        );

        address token0 = decodedCallBkData.poolKey.token0;
        address token1 = decodedCallBkData.poolKey.token1;
        address tokenAddress;
        address collateralAddress;

        if (decodedCallBkData.isToken0Collateral) {
            collateralAddress = token0;
            tokenAddress = token1;
        } else {
            collateralAddress = token1;
            tokenAddress = token0;
        }

        if (decodedCallBkData.isPositionInit) {
            _suppllyCollateralAndBorrow(
                tokenAddress,
                decodedCallBkData.units,
                collateralAddress,
                decodedCallBkData.flashCollateral,
                decodedCallBkData.userCollateral,
                decodedCallBkData.user
            );
        } else {
            _repayAndWithdrawCollateral(
                tokenAddress,
                decodedCallBkData.units,
                collateralAddress,
                decodedCallBkData.user,
                decodedCallBkData.targetHealthFactor
            );
        }

        // pay the required amounts back to the pair
        if (amount0Min > 0)
            pay(token0, decodedCallBkData.user, msg.sender, amount0Min);
        if (amount1Min > 0)
            pay(token1, decodedCallBkData.user, msg.sender, amount1Min);
    }
}
