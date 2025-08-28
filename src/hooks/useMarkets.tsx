

// Base hook to access context (private)
import {AssetsContext, AssetsContextType} from "@/contexts/assets_context";
import {useContext} from "react";
import {Market} from "@/types/market";
import {truncateDenom} from "@/utils/denom";

function useAssetsContext(): AssetsContextType {
    const context = useContext(AssetsContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetsProvider');
    }
    return context;
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

    const getMarketTicker = (market: Market): string => {
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
        getMarketTicker,
        isLoading
    };
}

// Hook for managing/writing markets data
export function useMarketsManager() {
    const { updateMarkets, isLoading } = useAssetsContext();
    return {
        updateMarkets,
        isLoading
    };
}
