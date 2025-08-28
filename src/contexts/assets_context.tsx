'use client';

import {createContext, useState, ReactNode, useEffect} from 'react';
import { Asset } from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";
import {Market, MarketData} from "@/types/market";
import {createMarketId} from "@/utils/market";
import {getMarkets} from "@/query/markets";
import {getAllTickers} from "@/query/aggregator";

export interface AssetsContextType {
    //assets
    assetsMap: Map<string, Asset>;
    updateAssets: (newAssets: Asset[]) => void;

    marketsMap: Map<string, Market>;
    updateMarkets: (newMarkets: Market[]) => void;

    marketsDataMap: Map<string, MarketData>;
    updateMarketsData: (newMarkets: MarketData[]) => void;

    //others
    isLoading: boolean;
}

export const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

interface AssetsProviderProps {
    children: ReactNode;
}

export function AssetsProvider({ children }: AssetsProviderProps) {
    const [assetsMap, setAssetsMap] = useState<Map<string, Asset>>(new Map());
    const [marketsMap, setMarketsMap] = useState<Map<string, Market>>(new Map());
    const [marketsDataMap, setMarketsDataMap] = useState<Map<string, MarketData>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    const updateAssets = (newAssets: Asset[]) => {
        // Create map for efficient lookups
        const newMap = new Map<string, Asset>();
        newAssets.forEach(asset => {
            newMap.set(asset.denom, asset);
        });

        setAssetsMap(newMap);
        setIsLoading(false);
    };

    const updateMarkets = (newMarkets: Market[]) => {
        const newMap = new Map<string, Market>();
        newMarkets.forEach(market => {
            newMap.set(createMarketId(market.base, market.quote), market);
        })

        setMarketsMap(newMap);
        setIsLoading(false);
    }

    const updateMarketsData = (newMarkets: MarketData[]) => {
        const newMap = new Map<string, MarketData>();
        newMarkets.forEach(market => {
            newMap.set(market.market_id, market);
        })

        setMarketsDataMap(newMap);
        setIsLoading(false);
    }

    useEffect(() => {
        //initial context loading
        const init = async () => {
            const [assets, markets, tickers] = await Promise.all([getChainAssets(), getMarkets(), getAllTickers()])
            updateAssets(assets)
            updateMarkets(markets)
            updateMarketsData(tickers)

            setIsLoading(false)
        }

        init();
    }, [])

    return (
        <AssetsContext.Provider value={{
            assetsMap,
            updateAssets,
            marketsMap,
            updateMarkets,
            isLoading,
            marketsDataMap,
            updateMarketsData
        }}>
            {children}
        </AssetsContext.Provider>
    );
}