import {Balance} from "@/types/balance";
import {Asset} from "@/types/asset";
import {LiquidityPoolData, UserPoolData} from "@/types/liquidity_pool";
import {toBigNumber} from "@/utils/amount";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import BigNumber from "bignumber.js";

export const calculateUserPoolData = (
    balance: Balance | undefined,
    lpAsset: Asset | undefined,
    poolData: LiquidityPoolData | undefined
): UserPoolData => {
    const zeroBN = toBigNumber(0)
    if (!balance || balance.amount.isZero()) {
        return { userLiquidityUsd: zeroBN, userSharesPercentage: 0 }
    }

    if (!lpAsset) {
        return { userLiquidityUsd: zeroBN, userSharesPercentage: 0 }
    }

    const userShares = toBigNumber(balance.amount)
    const totalShares = toBigNumber(lpAsset.supply)

    if (totalShares.isZero()) {
        return { userLiquidityUsd: zeroBN, userSharesPercentage: 0 }
    }

    const userSharesPercentage = userShares.dividedBy(totalShares).multipliedBy(100).toNumber()

    let userLiquidityUsd = zeroBN
    if (poolData && poolData.usdValue) {
        userLiquidityUsd = userShares.dividedBy(totalShares).multipliedBy(poolData.usdValue)
    }

    return { userLiquidityUsd, userSharesPercentage }
}

export const calculatePoolOppositeAmount = (pool: LiquidityPoolSDKType, amount: string | BigNumber, isBase: boolean): BigNumber => {
    const amountBN = toBigNumber(amount);
    if (amountBN.isZero() || amountBN.isNaN()) {
        return toBigNumber(0);
    }

    const reserveBase = toBigNumber(pool.reserve_base);
    const reserveQuote = toBigNumber(pool.reserve_quote);

    if (reserveBase.isZero() || reserveQuote.isZero()) {
        return toBigNumber(0);
    }

    if (isBase) {
        // Given base amount, calculate quote amount
        // quoteAmount = (baseAmount * reserveQuote) / reserveBase
        return amountBN.multipliedBy(reserveQuote).dividedBy(reserveBase);
    } else {
        // Given quote amount, calculate base amount
        // baseAmount = (quoteAmount * reserveBase) / reserveQuote
        return amountBN.multipliedBy(reserveBase).dividedBy(reserveQuote);
    }
}

/**
 * Calculates the price of a given denom in terms of the opposing asset in the pool.
 *
 * @param denom - The denom to get the price for (must be either pool.base or pool.quote)
 * @param pool - The liquidity pool
 * @returns The price as a BigNumber, or null if the denom is not in the pool or reserves are invalid
 *
 * @example
 * // If pool has base="ubze" with reserve_base=1000000 and quote="uusdc" with reserve_quote=500000
 * // Price of ubze in uusdc = 500000 / 1000000 = 0.5
 * // Price of uusdc in ubze = 1000000 / 500000 = 2
 */
export const calculatePoolPrice = (
    denom: string,
    pool: LiquidityPoolSDKType
): BigNumber | null => {
    if (!pool || !denom) return null;

    const reserveBase = toBigNumber(pool.reserve_base);
    const reserveQuote = toBigNumber(pool.reserve_quote);

    // Check if reserves are valid
    if (reserveBase.lte(0) || reserveQuote.lte(0)) {
        return null;
    }

    // If denom is the base asset, return price in quote asset
    if (denom === pool.base) {
        return reserveQuote.dividedBy(reserveBase);
    }

    // If denom is the quote asset, return price in base asset
    if (denom === pool.quote) {
        return reserveBase.dividedBy(reserveQuote);
    }

    // Denom is not in this pool
    return null;
}

export const createPoolId = (base: string, quote: string) => {
    if (base > quote) return (
        `${quote}_${base}`
    )

    return `${base}_${quote}`
};

export const poolIdFromPoolDenom = (poolDenom: string) => poolDenom.replace("ulp_", '');
