
import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {createMarketId} from "@/utils/market";
import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import {useAssetsContext} from "@/hooks/useAssets";

export function useAssetPrice(denom: string) {
    const [isLoading, setLoading] = useState(true)
    const [price, setPrice] = useState<BigNumber>(BigNumber(0))
    const [change, setChange] = useState<number>(0)

    const {usdPricesMap, marketsDataMap, isLoadingPrices} = useAssetsContext()

    useEffect(() => {
        if (isLoadingPrices) return;
        setLoading(true)

        if (denom === getUSDCDenom()) {
            setPrice(BigNumber(1))
            setLoading(false)
            return
        }

        const assetPrice = usdPricesMap.get(denom)
        if (assetPrice) {
            setPrice(assetPrice)
        }

        const usdDenom = getUSDCDenom()
        const marketData = marketsDataMap.get(createMarketId(denom, usdDenom))
        if (marketData) {
            setChange(marketData.change)
            setLoading(false)
            return
        }

        const bzeDenom = getChainNativeAssetDenom()
        const marketData2 = marketsDataMap.get(createMarketId(denom, bzeDenom))
        if (marketData2) {
            setChange(marketData2.change)
            setLoading(false)
            return
        }

        setLoading(false)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingPrices]);

    const totalUsdValue = (amount: BigNumber): BigNumber => {
        return price.multipliedBy(amount)
    }

    return {
        price,
        change,
        totalUsdValue,
        isLoading: isLoading || isLoadingPrices,
    }
}
