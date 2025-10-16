import BigNumber from "bignumber.js";
import {PoolSDKType} from "@bze/bzejs/cosmos/staking/v1beta1/staking";

const DAY_TO_SECONDS = 24 * 60 * 60;

export const calcNativeStakingApr = (pool: PoolSDKType, communityTax: string, annualProvisions: BigNumber) => {
    const totalSupply = new BigNumber(pool?.bonded_tokens || 0).plus(
        pool?.not_bonded_tokens || 0
    );

    // Handle edge case
    if (totalSupply.isZero() || annualProvisions.isZero()) {
        return "0.00";
    }

    const bondedTokens = new BigNumber(pool?.bonded_tokens || 0);

    // Handle edge case
    if (bondedTokens.isZero()) {
        return "0.00";
    }

    const bondedTokensRatio = bondedTokens.div(totalSupply);

    // Calculate inflation rate
    const inflation = annualProvisions.div(totalSupply);

    // Convert communityTax string to BigNumber (e.g., "0.02" for 2%)
    const communityTaxRate = new BigNumber(communityTax || 0);

    // APR formula: (inflation * (1 - community_tax)) / bonded_ratio * 100
    const apr = inflation
        .multipliedBy(new BigNumber(1).minus(communityTaxRate))
        .div(bondedTokensRatio)
        .multipliedBy(100) // Convert to percentage
        .decimalPlaces(2, BigNumber.ROUND_DOWN);

    return apr.toString();
};

export const parseUnbondingDays = (unbondingTime: string) => {
    const split = unbondingTime.split("s");

    return new BigNumber(split[0] || 0)
        .div(DAY_TO_SECONDS)
        .decimalPlaces(0)
        .toString();
};
