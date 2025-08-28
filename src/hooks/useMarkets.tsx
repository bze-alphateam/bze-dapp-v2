import {AssetsContext, AssetsContextType} from "@/contexts/assets_context";
import {useContext} from "react";
import {Market, MarketData} from "@/types/market";
import {truncateDenom} from "@/utils/denom";
import BigNumber from "bignumber.js";

function useAssetsContext(): AssetsContextType {
    const context = useContext(AssetsContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetsProvider');
    }
    return context;
}

interface MarketSymbolArgs {
    base: string;
    quote: string;
}

// Hook for reading assets data
export function useMarkets() {
    const { marketsMap, isLoading, assetsMap } = useAssetsContext();

    const getMarketById = (id: string): Market | undefined => {
        return marketsMap.get(id);
    };

    const getAssetMarkets = (denom: string): Market[] => {
        //put first markets where the provided denom is quote and afterward where is base
        return [...markets.filter(market => market.base === denom), ...markets.filter(market => market.quote === denom)]
    }

    const getMarketSymbol = (market: MarketSymbolArgs): string => {
        let base = assetsMap.get(market.base)?.ticker
        if (!base) {
            base = truncateDenom(market.base)
        }

        let quote = assetsMap.get(market.quote)?.ticker
        if (!quote) {
            quote = truncateDenom(market.quote)
        }

        return `${base}/${quote}`
    }

    const marketExists = (marketId: string): boolean => marketsMap.has(marketId)

    const markets = Array.from(marketsMap.values())

    return {
        markets,
        getMarketById,
        getAssetMarkets,
        getMarketSymbol,
        isLoading,
        marketExists
    };
}

export function useMarketTradingData(){
    const { marketsDataMap, isLoading } = useAssetsContext();

    const getAssetMarketsData = (denom: string): MarketData[] => {
        return [...marketsData.filter(market => market.base === denom), ...marketsData.filter(market => market.quote === denom)]
    }

    const marketsData = Array.from(marketsDataMap.values())

    const getMarketDataById = (id: string): MarketData | undefined => {
        return marketsDataMap.get(id);
    }

    const getAsset24hTradedVolume = (denom: string): BigNumber => {
        const assetMarkets = getAssetMarketsData(denom)

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
        getAssetMarketsData,
        marketsData,
        getMarketDataById,
        getAsset24hTradedVolume
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
