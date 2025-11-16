import BigNumber from "bignumber.js";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";

export interface LiquidityPoolData {
    usdVolume: BigNumber; //24h volume in USD
    usdValue: BigNumber;
    usdFees: BigNumber; //24h fees in USD
    isComplete: boolean; //is false when one of the assets doesn't have a USD price
    apr: string,
}

export interface UserPoolData {
    userLiquidityUsd: BigNumber;
    userSharesPercentage: number;
}

export interface SwapRouteResult {
    route: string[];                      // Array of pool IDs in order
    path: string[];                       // Array of denoms in the swap path
    pools: LiquidityPoolSDKType[];        // Pool objects (for recalculating with new amounts)
    expectedOutput: BigNumber;            // Expected output amount
    priceImpact: BigNumber;               // Price impact as a percentage (slippage only)
    totalFees: BigNumber;                 // Total fee impact in output denom (how much more you'd get with 0% fees)
    feesPerHop: BigNumber[];              // Individual fees for each hop (each in different denom)
}
