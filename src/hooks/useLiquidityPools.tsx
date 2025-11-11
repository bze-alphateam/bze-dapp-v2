import {useCallback, useEffect, useMemo, useState} from "react";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import {getLiquidityPool, getLiquidityPools} from "@/query/liquidity_pools";
import {LiquidityPoolData} from "@/types/liquidity_pool";
import {toBigNumber, uAmountToBigNumberAmount} from "@/utils/amount";
import {useAssetsContext} from "@/hooks/useAssets";
import BigNumber from "bignumber.js";
import {LP_ASSETS_DECIMALS} from "@/types/asset";

const getPoolData = (pool: LiquidityPoolSDKType, prices: Map<string, BigNumber>): LiquidityPoolData => {
    const basePrice = prices.get(pool.base) || toBigNumber(0)
    const quotePrice = prices.get(pool.quote) || toBigNumber(0)
    const isComplete = basePrice.gt(0) && quotePrice.gt(0)

    return {
        usdValue: basePrice.multipliedBy(pool.reserve_base).plus(quotePrice.multipliedBy(pool.reserve_quote)),
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

    const {usdPricesMap, isLoadingPrices} = useAssetsContext()

    const load = useCallback(async () => {
        const [pools] = await Promise.all([getLiquidityPools()])
        const poolsData = new Map<string, LiquidityPoolData>()

        pools.map(pool => {
            poolsData.set(pool.id, getPoolData(pool, usdPricesMap))
        })

        setPoolsData(poolsData)
        setPools(pools)
        setIsLoading(false)
    }, [usdPricesMap])

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
        setPoolData(getPoolData(pool, usdPricesMap))
        setIsLoading(false)
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const userShares = useMemo(() => {
        if (!pool) return toBigNumber(0)

        const balance = balancesMap.get(pool.lp_denom)
        if (!balance) return toBigNumber(0)

        return uAmountToBigNumberAmount(balance.amount, LP_ASSETS_DECIMALS)
    } , [balancesMap, pool])

    const totalShares = useMemo(() => {
        if (!assetsMap || !pool) return toBigNumber(0)

        const sharesAsset = assetsMap.get(pool.lp_denom)
        if (!sharesAsset) return toBigNumber(0)

        return uAmountToBigNumberAmount(sharesAsset?.supply || 0, LP_ASSETS_DECIMALS)
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
    }
}
