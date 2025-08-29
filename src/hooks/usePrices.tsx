import {useMarkets} from "@/hooks/useMarkets";
import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {createMarketId} from "@/utils/market";
import {getBZEUSDPrice} from "@/query/prices";
import {getMarketOrdersHistory} from "@/query/aggregator";
import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";

export function useAssetPrice(denom: string) {
    const [isLoading, setLoading] = useState(true)
    const [price, setPrice] = useState<BigNumber>(BigNumber(0))
    const [change, setChange] = useState<number>(0)

    const {marketExists, getMarketData, isLoading: isLoadingMarkets} = useMarkets()

    useEffect(() => {
        const loadAssetUSDPrice = async () => {
            const usdcDenom = getUSDCDenom()
            if (usdcDenom !== "") {
                const usdcMarketId = createMarketId(denom, usdcDenom)
                if (marketExists(usdcMarketId)) {
                    // the asset has a USDC market -> we can use it directly to find the price
                    const usdcMarket = getMarketData(usdcMarketId)
                    if (usdcMarket && usdcMarket.last_price > 0) {
                        setPrice(BigNumber(usdcMarket.last_price))
                        setChange(usdcMarket.change)
                        setLoading(false)
                        return
                    }

                    const history = await getMarketOrdersHistory(usdcMarketId, 1)
                    if (history.length > 0) {
                        setPrice(BigNumber(history[0].price))
                        setLoading(false)
                        return
                    }
                }
            }

            //we couldn't find a price for this asset with USDC
            //we will try to find a BZE market and deduct the price from it
            const bzeDenom = getChainNativeAssetDenom()
            const bzeUsdPrice = await getBZEUSDPrice()
            if (denom === bzeDenom) {
                setPrice(BigNumber(bzeUsdPrice))
                setLoading(false)
                return
            }

            const bzeMarketId = createMarketId(denom, bzeDenom)
            if (!marketExists(bzeMarketId)) {
                //we couldn't find a BZE market either
                setPrice(BigNumber(0))
                setLoading(false)
                return
            }

            const bzeMarket = getMarketData(bzeMarketId)
            if (bzeMarket && bzeMarket.last_price > 0) {
                setPrice(BigNumber(bzeMarket.last_price).multipliedBy(bzeUsdPrice))
                setChange(bzeMarket.change)
                setLoading(false)
                return
            }

            const history = await getMarketOrdersHistory(createMarketId(denom, bzeDenom), 1)
            if (history.length > 0) {
                setPrice(BigNumber(history[0].price).multipliedBy(bzeUsdPrice))
                setLoading(false)
                return
            }

            setLoading(false)
        }

        loadAssetUSDPrice()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingMarkets]);

    return {
        price,
        change,
        isLoading: isLoading || isLoadingMarkets,
    }
}
