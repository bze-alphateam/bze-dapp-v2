import {Balance} from "@/types/balance";
import {Asset} from "@/types/asset";
import {LiquidityPoolData, UserPoolData} from "@/types/liquidity_pool";
import {toBigNumber} from "@/utils/amount";

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
