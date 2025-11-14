import BigNumber from "bignumber.js";

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
