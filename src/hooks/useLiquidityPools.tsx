import {useCallback, useEffect, useMemo, useState} from "react";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import {LiquidityPoolData} from "@/types/liquidity_pool";
import {toBigNumber} from "@/utils/amount";
import {useAssetsContext} from "@/hooks/useAssets";
import BigNumber from "bignumber.js";

export function useLiquidityPools() {
    const {poolsMap, poolsDataMap, isLoading} = useAssetsContext()

    const pools = useMemo(() => Array.from(poolsMap.values()), [poolsMap])

    return {
        pools,
        isLoading: isLoading,
        poolsData: poolsDataMap,
    }
}

export function useLiquidityPool(poolId: string) {
    const [pool, setPool] = useState<LiquidityPoolSDKType>()
    const [poolData, setPoolData] = useState<LiquidityPoolData>()
    const {balancesMap, assetsMap, poolsMap, poolsDataMap, isLoading} = useAssetsContext()

    const userShares = useMemo(() => {
        if (!pool) return toBigNumber(0)

        const balance = balancesMap.get(pool.lp_denom)
        if (!balance) return toBigNumber(0)

        return toBigNumber(balance.amount)
    } , [balancesMap, pool])

    const totalShares = useMemo(() => {
        if (!assetsMap || !pool) return toBigNumber(0)

        const sharesAsset = assetsMap.get(pool.lp_denom)
        if (!sharesAsset) return toBigNumber(0)

        return toBigNumber(sharesAsset?.supply || 0)
    }, [assetsMap, pool])

    const userSharesPercentage = useMemo(() => {
        if (!userShares || !totalShares || totalShares.isZero()) {
            return toBigNumber(0);
        }

        return userShares.dividedBy(totalShares).multipliedBy(100).toFixed(2);
    }, [userShares, totalShares]);

    const userReserveBase = useMemo(() => {
        if (!pool || !userShares || !totalShares || totalShares.isZero()) {
            return toBigNumber(0);
        }

        const reserveBase = toBigNumber(pool.reserve_base);
        return userShares.dividedBy(totalShares).multipliedBy(reserveBase);
    }, [pool, userShares, totalShares]);

    const userReserveQuote = useMemo(() => {
        if (!pool || !userShares || !totalShares || totalShares.isZero()) {
            return toBigNumber(0);
        }

        const reserveQuote = toBigNumber(pool.reserve_quote);
        return userShares.dividedBy(totalShares).multipliedBy(reserveQuote);
    }, [pool, userShares, totalShares]);

    //calculates the opposite amount of a given amount in the pool
    const calculateOppositeAmount = useCallback((amount: string | BigNumber, isBase: boolean): BigNumber => {
        if (!pool) {
            return toBigNumber(0);
        }

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
    }, [pool]);

    const calculateSharesFromAmounts = useCallback((baseAmount: string | BigNumber, quoteAmount: string | BigNumber): BigNumber => {
        if (!pool || !totalShares) {
            return toBigNumber(0);
        }

        const baseAmountBN = toBigNumber(baseAmount);
        const quoteAmountBN = toBigNumber(quoteAmount);

        if (baseAmountBN.isZero() || baseAmountBN.isNaN() || quoteAmountBN.isZero() || quoteAmountBN.isNaN()) {
            return toBigNumber(0);
        }

        const reserveBase = toBigNumber(pool.reserve_base);
        const reserveQuote = toBigNumber(pool.reserve_quote);

        if (reserveBase.isZero() || reserveQuote.isZero() || totalShares.isZero()) {
            return toBigNumber(0);
        }

        // Calculate ratios: baseAmount / poolBaseReserve and quoteAmount / poolQuoteReserve
        const baseRatio = baseAmountBN.dividedBy(reserveBase);
        const quoteRatio = quoteAmountBN.dividedBy(reserveQuote);

        // Use the smaller ratio (mimics the Go code's LT comparison)
        const mintRatio = BigNumber.minimum(baseRatio, quoteRatio);

        // Calculate tokens to mint: mintRatio * lpSupply
        const tokensToMint = mintRatio.multipliedBy(totalShares);

        // Truncate to integer (mimics Go's TruncateInt())
        return tokensToMint.integerValue(BigNumber.ROUND_DOWN);
    }, [pool, totalShares]);

    useEffect(() => {
        setPool(poolsMap.get(poolId))
        setPoolData(poolsDataMap.get(poolId))
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poolId]);

    return {
        isLoading: isLoading,
        pool,
        poolData,
        userShares,
        totalShares,
        userSharesPercentage,
        userReserveBase,
        userReserveQuote,
        calculateOppositeAmount,
        calculateSharesFromAmounts,
    }
}
