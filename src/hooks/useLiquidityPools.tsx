import {useCallback, useEffect, useMemo, useState} from "react";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import {getLiquidityPool, getLiquidityPools} from "@/query/liquidity_pools";
import {LiquidityPoolData} from "@/types/liquidity_pool";
import {toBigNumber, uAmountToAmount} from "@/utils/amount";
import {useAssetsContext} from "@/hooks/useAssets";
import BigNumber from "bignumber.js";
import {Asset} from "@/types/asset";

const getPoolData = (pool: LiquidityPoolSDKType, prices: Map<string, BigNumber>, baseAsset?: Asset, quoteAsset?: Asset): LiquidityPoolData => {
    const basePrice = prices.get(pool.base) || toBigNumber(0)
    const quotePrice = prices.get(pool.quote) || toBigNumber(0)
    const isComplete = basePrice.gt(0) && quotePrice.gt(0)

    return {
        usdValue: basePrice.multipliedBy(uAmountToAmount(pool.reserve_base, baseAsset?.decimals || 0)).plus(quotePrice.multipliedBy(uAmountToAmount(pool.reserve_quote, quoteAsset?.decimals || 0))),
        usdVolume: toBigNumber(0), //TODO: get volume from Aggregator
        isComplete: isComplete,
        apr: '0', //TODO: calculate APR
        usdFees: toBigNumber(0) //calculate fees
    }
}

export function useLiquidityPools() {
    const [isLoading, setIsLoading] = useState(true)
    const [pools, setPools] = useState<LiquidityPoolSDKType[]>([])
    const [poolsData, setPoolsData] = useState<Map<string, LiquidityPoolData>>(new Map())

    const {usdPricesMap, isLoadingPrices, assetsMap} = useAssetsContext()

    const load = useCallback(async () => {
        const [pools] = await Promise.all([getLiquidityPools()])
        const poolsData = new Map<string, LiquidityPoolData>()

        pools.map(pool => {
            poolsData.set(pool.id, getPoolData(pool, usdPricesMap, assetsMap.get(pool.base), assetsMap.get(pool.quote)))
        })

        setPoolsData(poolsData)
        setPools(pools)
        setIsLoading(false)
    }, [usdPricesMap, assetsMap])

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        pools,
        isLoading: isLoading || isLoadingPrices,
        poolsData,
        reload: load,
    }
}

export function useLiquidityPool(poolId: string) {
    const [isLoading, setIsLoading] = useState(true)
    const [pool, setPool] = useState<LiquidityPoolSDKType>()
    const [poolData, setPoolData] = useState<LiquidityPoolData>()

    const {usdPricesMap, isLoadingPrices, balancesMap, assetsMap} = useAssetsContext()

    const load = useCallback(async () => {
        if (!poolId || poolId === '') return;

        const [pool] = await Promise.all([getLiquidityPool(poolId)])
        if (!pool) return;
        setPool(pool)
        setPoolData(getPoolData(pool, usdPricesMap, assetsMap.get(pool.base), assetsMap.get(pool.quote)))
        setIsLoading(false)
    }, [poolId, usdPricesMap, assetsMap])

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
        load();
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poolId, usdPricesMap]);

    return {
        isLoading: isLoading || isLoadingPrices,
        pool,
        poolData,
        reload: load,
        userShares,
        totalShares,
        userSharesPercentage,
        userReserveBase,
        userReserveQuote,
        calculateOppositeAmount,
        calculateSharesFromAmounts,
    }
}
