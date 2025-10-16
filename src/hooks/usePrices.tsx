
import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {createMarketId} from "@/utils/market";
import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import {useAssetsContext} from "@/hooks/useAssets";

export function useAssetPrice(denom: string) {
    const [isLoading, setLoading] = useState(true)
    const [price, setPrice] = useState<BigNumber>(BigNumber(0))
    const [change, setChange] = useState<number>(0)

    const {usdPricesMap, marketsDataMap, isLoading: isLoadingContext} = useAssetsContext()

    useEffect(() => {
        console.log('useAssetPrice', denom)
        console.log('usdPricesMap', usdPricesMap)
        setLoading(true)
        if (isLoadingContext) return;

        const assetPrice = usdPricesMap.get(denom)
        if (assetPrice) {
            setPrice(assetPrice)
        }

        const usdDenom = getUSDCDenom()
        const bzeDenom = getChainNativeAssetDenom()
        const marketData = marketsDataMap.get(createMarketId(denom, usdDenom))
        if (marketData && marketData.change > 0) {
            setChange(marketData.change)
            return
        }

        const marketData2 = marketsDataMap.get(createMarketId(denom, bzeDenom))
        if (marketData2 && marketData2.change > 0) {
            setChange(marketData2.change)
            return
        }

        setLoading(false)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingContext]);

    const totalUsdValue = (amount: BigNumber): BigNumber => {
        return price.multipliedBy(amount)
    }

    return {
        price,
        change,
        totalUsdValue,
        isLoading: isLoading || isLoadingContext,
    }
}
