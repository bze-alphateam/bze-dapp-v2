import {useMarkets, useMarketTradingData} from "@/hooks/useMarkets";
import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {createMarketId} from "@/utils/market";
import {getBZEUSDPrice} from "@/query/prices";
import {getMarketOrdersHistory} from "@/query/aggregator";
import BigNumber from "bignumber.js";

export interface AssetPrice {
    denom: string;
    price: BigNumber;
    change: number;
}

export function usePrices() {
    const { getMarketDataById } = useMarketTradingData()
    const { marketExists } = useMarkets()

    const getAssetUSDPrice = async (denom: string): Promise<AssetPrice> => {
        const result = {
            denom: denom,
            price: BigNumber(0),
            change: 0
        }

        const usdcDenom = getUSDCDenom()
        if (usdcDenom !== "") {
            const usdcMarketId = createMarketId(denom, usdcDenom)
            if (marketExists(usdcMarketId)) {
                // the asset has a USDC market -> we can use it directly to find the price
                const usdcMarket = getMarketDataById(usdcMarketId)
                if (usdcMarket && usdcMarket.last_price > 0) {
                    result.price = BigNumber(usdcMarket.last_price)
                    result.change = usdcMarket.change

                    return result
                }

                const history = await getMarketOrdersHistory(usdcMarketId, 1)
                if (history.length > 0) {
                    result.price = BigNumber(history[0].price)

                    return result
                }
            }
        }

        //we couldn't find a price for this asset with USDC
        //we will try to find a BZE market and deduct the price from it
        const bzeDenom = getChainNativeAssetDenom()
        const bzeUsdPrice = await getBZEUSDPrice()
        if (denom === bzeDenom) {
            result.price = BigNumber(bzeUsdPrice)
            return result
        }

        const bzeMarketId = createMarketId(denom, bzeDenom)
        if (!marketExists(bzeMarketId)) {
            //we couldn't find a BZE market either
            result.price = BigNumber(0)
            return result
        }

        const bzeMarket = getMarketDataById(bzeMarketId)
        if (bzeMarket && bzeMarket.last_price > 0) {
            result.price = BigNumber(bzeMarket.last_price).multipliedBy(bzeUsdPrice)
            result.change = bzeMarket.change

            return result
        }

        const history = await getMarketOrdersHistory(createMarketId(denom, bzeDenom), 1)
        if (history.length > 0) {
            result.price = BigNumber(history[0].price).multipliedBy(bzeUsdPrice)
            return result
        }

        return result
    }

    return {
        getAssetUSDPrice
    }
}
