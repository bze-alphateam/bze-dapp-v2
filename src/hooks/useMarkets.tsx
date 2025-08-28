

// Base hook to access context (private)
import {AssetsContext, AssetsContextType} from "@/contexts/assets_context";
import {useContext} from "react";
import {Market, MarketData} from "@/types/market";
import {truncateDenom} from "@/utils/denom";

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

    const markets = Array.from(marketsMap.values())

    return {
        markets,
        getMarketById,
        getAssetMarkets,
        getMarketSymbol,
        isLoading
    };
}

export function useMarketTradingData(){
    const { marketsDataMap, isLoading } = useAssetsContext();

    const getAssetMarketsData = (denom: string): MarketData[] => {
        return [...marketsData.filter(market => market.base === denom), ...marketsData.filter(market => market.quote === denom)]
    }

    const marketsData = Array.from(marketsDataMap.values())

    return {
        isLoading,
        getAssetMarketsData,
        marketsData
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
