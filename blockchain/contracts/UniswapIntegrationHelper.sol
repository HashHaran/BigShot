// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";
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
    IUniswapV3SwapCallback,
    PeripheryPayments
{
    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;

    /// @dev The minimum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MIN_TICK)
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    /// @dev The maximum value that can be returned from #getSqrtRatioAtTick. Equivalent to getSqrtRatioAtTick(MAX_TICK)
    uint160 internal constant MAX_SQRT_RATIO =
        1461446703485210103287273052203988822378723970342;

    constructor(
        address _factory,
        address _WETH9,
        address _aavePoolAddress,
        address _aaveOracleAddress,
        address _aaveAusdcTokenAddress
    )
        PeripheryImmutableState(_factory, _WETH9)
        AaveIntegrationHelper(
            _aavePoolAddress,
            _aaveOracleAddress,
            _aaveAusdcTokenAddress
        )
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

    struct UniswapFlashParams {
        address token0;
        address token1;
        uint256 amount0;
        uint256 amount1;
        bool isToken0Collateral;
    }

    function _initiateShortPositionWithFlashSwapCollateral(
        address tokenAddress,
        address collateralAddress,
        uint24 uniswapPoolFee,
        uint256 flashCollateral,
        uint256 userCollateral
    ) internal {
        UniswapFlashParams memory flashParams;
        flashParams.amount0 = 0;
        flashParams.amount1 = 0;

        if (tokenAddress < collateralAddress) {
            flashParams.token0 = tokenAddress;
            flashParams.token1 = collateralAddress;
            flashParams.amount1 = flashCollateral;
            flashParams.isToken0Collateral = false;
        } else {
            flashParams.token0 = collateralAddress;
            flashParams.token1 = tokenAddress;
            flashParams.amount0 = flashCollateral;
            flashParams.isToken0Collateral = true;
        }

        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: flashParams.token0,
            token1: flashParams.token1,
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
        // pool.flash(
        //     address(this),
        //     flashParams.amount0,
        //     flashParams.amount1,
        //     abi.encode(
        //         FlashCallbackData({
        //             amount0: flashParams.amount0,
        //             amount1: flashParams.amount1,
        //             user: msg.sender,
        //             poolKey: poolKey,
        //             isPositionInit: true,
        //             isToken0Collateral: flashParams.isToken0Collateral,
        //             units: units,
        //             userCollateral: userCollateral,
        //             flashCollateral: flashCollateral,
        //             targetHealthFactor: 0
        //         })
        //     )
        // );
        pool.swap(
            address(this),
            !flashParams.isToken0Collateral,
            -1 * int256(flashCollateral),
            !flashParams.isToken0Collateral
                ? MIN_SQRT_RATIO + 1
                : MAX_SQRT_RATIO - 1,
            abi.encode(
                FlashCallbackData({
                    amount0: flashParams.amount0,
                    amount1: flashParams.amount1,
                    user: msg.sender,
                    poolKey: poolKey,
                    isPositionInit: true,
                    isToken0Collateral: flashParams.isToken0Collateral,
                    units: 0,
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
        UniswapFlashParams memory flashParams;
        flashParams.amount0 = 0;
        flashParams.amount1 = 0;

        if (tokenAddress < collateralAddress) {
            flashParams.token0 = tokenAddress;
            flashParams.token1 = collateralAddress;
            flashParams.amount0 = units;
            flashParams.isToken0Collateral = false;
        } else {
            flashParams.token0 = collateralAddress;
            flashParams.token1 = tokenAddress;
            flashParams.amount1 = units;
            flashParams.isToken0Collateral = true;
        }

        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: flashParams.token0,
            token1: flashParams.token1,
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
        // pool.flash(
        //     address(this),
        //     flashParams.amount0,
        //     flashParams.amount1,
        //     abi.encode(
        //         FlashCallbackData({
        //             amount0: flashParams.amount0,
        //             amount1: flashParams.amount1,
        //             user: msg.sender,
        //             poolKey: poolKey,
        //             isPositionInit: false,
        //             isToken0Collateral: flashParams.isToken0Collateral,
        //             units: units,
        //             userCollateral: 0,
        //             flashCollateral: 0,
        //             targetHealthFactor: targetHealthFactor
        //         })
        //     )
        // );
        pool.swap(
            address(this),
            flashParams.isToken0Collateral,
            -1 * int256(units),
            flashParams.isToken0Collateral
                ? MIN_SQRT_RATIO + 1
                : MAX_SQRT_RATIO - 1,
            abi.encode(
                FlashCallbackData({
                    amount0: flashParams.amount0,
                    amount1: flashParams.amount1,
                    user: msg.sender,
                    poolKey: poolKey,
                    isPositionInit: false,
                    isToken0Collateral: flashParams.isToken0Collateral,
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
        if (amount0Min > 0) pay(token0, address(this), msg.sender, amount0Min);
        if (amount1Min > 0) pay(token1, address(this), msg.sender, amount1Min);
    }

    /// @notice Called to `msg.sender` after executing a swap via IUniswapV3Pool#swap.
    /// @dev In the implementation you must pay the pool tokens owed for the swap.
    /// The caller of this method must be checked to be a UniswapV3Pool deployed by the canonical UniswapV3Factory.
    /// amount0Delta and amount1Delta can both be 0 if no tokens were swapped.
    /// @param amount0Delta The amount of token0 that was sent (negative) or must be received (positive) by the pool by
    /// the end of the swap. If positive, the callback must send that amount of token0 to the pool.
    /// @param amount1Delta The amount of token1 that was sent (negative) or must be received (positive) by the pool by
    /// the end of the swap. If positive, the callback must send that amount of token1 to the pool.
    /// @param data Any data passed through by the caller via the IUniswapV3PoolActions#swap call
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        FlashCallbackData memory decodedCallBkData = abi.decode(
            data,
            (FlashCallbackData)
        );
        CallbackValidation.verifyCallback(factory, decodedCallBkData.poolKey);

        address payToken;
        uint256 payAmount;
        address tokenAddress;
        address collateralAddress;
        int256 tokenDelta;
        int256 collateralDelta;

        if (decodedCallBkData.isToken0Collateral) {
            console.log("Collateral amount delta: ");
            console.logInt(amount0Delta);
            console.log("Token amount delta: ");
            console.logInt(amount1Delta);
            tokenAddress = decodedCallBkData.poolKey.token1;
            collateralAddress = decodedCallBkData.poolKey.token0;
            tokenDelta = amount1Delta;
            collateralDelta = amount0Delta;
        } else {
            console.log("Collateral amount delta: ");
            console.logInt(amount1Delta);
            console.log("Token amount delta: ");
            console.logInt(amount0Delta);
            tokenAddress = decodedCallBkData.poolKey.token0;
            collateralAddress = decodedCallBkData.poolKey.token1;
            tokenDelta = amount0Delta;
            collateralDelta = amount1Delta;
        }

        if (decodedCallBkData.isPositionInit) {
            payToken = tokenAddress;
            payAmount = uint256(tokenDelta);
            console.log("Pay Amount: ");
            console.logUint(payAmount);
            console.log("Pay Token: ");
            console.logAddress(payToken);
            _suppllyCollateralAndBorrow(
                tokenAddress,
                payAmount,
                collateralAddress,
                decodedCallBkData.flashCollateral,
                decodedCallBkData.userCollateral,
                decodedCallBkData.user
            );
            pay(payToken, address(this), msg.sender, payAmount);
        } else {
            payToken = collateralAddress;
            payAmount = uint256(collateralDelta);
            console.log("Pay Amount: ");
            console.logUint(payAmount);
            console.log("Pay Token: ");
            console.logAddress(payToken);
            _repayAndWithdrawCollateral(
                tokenAddress,
                decodedCallBkData.units,
                collateralAddress,
                decodedCallBkData.user,
                decodedCallBkData.targetHealthFactor
            );
            pay(payToken, decodedCallBkData.user, msg.sender, payAmount);
        }
    }
}
