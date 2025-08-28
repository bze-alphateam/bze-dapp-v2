'use client';

import {createContext, useState, ReactNode, useEffect} from 'react';
import { Asset } from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";
import {Market} from "@/types/market";
import {createMarketId} from "@/utils/market";
import {getMarkets} from "@/query/markets";

export interface AssetsContextType {
    //assets
    assetsMap: Map<string, Asset>;
    updateAssets: (newAssets: Asset[]) => void;

    marketsMap: Map<string, Market>;
    updateMarkets: (newMarkets: Market[]) => void;

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

    useEffect(() => {
        //initial context loading
        const init = async () => {
            const [assets, markets] = await Promise.all([getChainAssets(), getMarkets()])
            updateAssets(assets)
            updateMarkets(markets)

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
            isLoading
        }}>
            {children}
        </AssetsContext.Provider>
    );
}