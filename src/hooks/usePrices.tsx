import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {createMarketId} from "@/utils/market";
import BigNumber from "bignumber.js";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useAssetsContext} from "@/hooks/useAssets";
import {uAmountToBigNumberAmount} from "@/utils/amount";

export function useAssetPrice(denom: string) {
    const [isLoading, setLoading] = useState(true)
    const [price, setPrice] = useState<BigNumber>(BigNumber(0))
    const [change, setChange] = useState<number>(0)

    const {usdPricesMap, marketsDataMap, isLoadingPrices} = useAssetsContext()

    const usdDenom = useMemo(() => getUSDCDenom(), []);
    const bzeDenom = useMemo(() => getChainNativeAssetDenom(), []);

    useEffect(() => {
        if (isLoadingPrices) return;
        setLoading(true)

        if (denom === usdDenom) {
            setPrice(BigNumber(1))
            setLoading(false)
            return
        }

        const assetPrice = usdPricesMap.get(denom)
        if (assetPrice) {
            setPrice(assetPrice)
        }

        const marketData = marketsDataMap.get(createMarketId(denom, usdDenom))
        if (marketData) {
            setChange(marketData.change)
            setLoading(false)
            return
        }

        const marketData2 = marketsDataMap.get(createMarketId(denom, bzeDenom))
        if (marketData2) {
            setChange(marketData2.change)
            setLoading(false)
            return
        }

        setLoading(false)
    }, [isLoadingPrices, denom, usdPricesMap, marketsDataMap, usdDenom, bzeDenom]);

    // returns the value in USD of the provided amount. the amount is assumed to be in display denom (not base denom)
    const totalUsdValue = useCallback((amount: BigNumber): BigNumber => {
        return price.multipliedBy(amount)
    }, [price]);

    const uAmountUsdValue = useCallback((amount: BigNumber, decimals: number): BigNumber => {
        return totalUsdValue(uAmountToBigNumberAmount(amount, decimals))
    }, [totalUsdValue]);

    return {
        price,
        change,
        totalUsdValue,
        uAmountUsdValue,
        isLoading: isLoading || isLoadingPrices,
    }
}
