import {Market, MarketData} from "@/types/market";
import {truncateDenom} from "@/utils/denom";
import BigNumber from "bignumber.js";
import {useAssetsContext} from "@/hooks/useAssets";
import {useMemo} from "react";

// Hook for reading markets data and helpers to check if a market exists and get a market's symbol
export function useMarkets() {
    const { marketsMap, marketsDataMap, isLoading } = useAssetsContext();

    const markets = Array.from(marketsMap.values())
    const marketsData = Array.from(marketsDataMap.values())

    const marketExists = (marketId: string): boolean => marketsMap.has(marketId)

    const getMarketData = (marketId: string): MarketData | undefined => marketsDataMap.get(marketId)
    const getMarket = (marketId: string): Market | undefined => marketsMap.get(marketId)

    return {
        markets,
        marketsData,
        isLoading,
        marketExists,
        getMarketData,
        getMarket
    };
}

export function useAssetMarkets(denom: string) {
    const { isLoading, markets, marketsData } = useMarkets();

    const assetMarkets = (): Market[] => {
        const baseMatches = []
        const quoteMatches = []

        for (const market of markets) {
            if (market.base === denom) baseMatches.push(market)
            else if (market.quote === denom) quoteMatches.push(market)
        }

        return [...baseMatches, ...quoteMatches]
    }

    const assetMarketsData = (): MarketData[] => {
        const baseMatches = []
        const quoteMatches = []

        for (const market of marketsData) {
            if (market.base === denom) baseMatches.push(market)
            else if (market.quote === denom) quoteMatches.push(market)
        }

        return [...baseMatches, ...quoteMatches]
    }

    const getAsset24hTradedVolume = (): BigNumber => {
        const assetMarkets = assetMarketsData()

        return assetMarkets.reduce((acc, market) => {
            // Only sum base_volume if the asset denom matches the market's base
            if (denom === market.base) {
                return acc.plus(market.base_volume || 0)
            }

            // Only sum quote_volume if the asset denom matches the market's quote
            else if (denom === market.quote) {
                return acc.plus(market.quote_volume || 0)
            }

            // If denom doesn't match either base or quote, don't add anything
            return acc
        }, new BigNumber(0))
    }

    return {
        isLoading,
        assetMarkets,
        assetMarketsData,
        getAsset24hTradedVolume,
    }
}

export function useMarket(marketId: string) {
    const { marketsMap, marketsDataMap, isLoading, assetsMap } = useAssetsContext();

    const market = marketsMap.get(marketId)

    const marketSymbol = useMemo((): string => {
        if (isLoading) return ""
        if (!market) return ""

        let base = assetsMap.get(market.base)?.ticker
        if (!base) {
            base = truncateDenom(market.base)
        }

        let quote = assetsMap.get(market.quote)?.ticker
        if (!quote) {
            quote = truncateDenom(market.quote)
        }

        return `${base}/${quote}`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketId, isLoading])

    return {
        isLoading,
        market,
        marketData: marketsDataMap.get(marketId),
        marketSymbol
    }
}

// Hook for managing/writing markets data
export function useMarketsManager() {
    const { updateMarkets, isLoading } = useAssetsContext();
    return {
        updateMarkets,
        isLoading
    };
}
