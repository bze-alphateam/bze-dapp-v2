'use client';

import {createContext, useState, ReactNode, useEffect} from 'react';
import { Asset } from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";

export interface AssetsContextType {
    assets: Asset[]; // derived from assetsMap
    assetsMap: Map<string, Asset>;
    updateAssets: (newAssets: Asset[]) => void;
    getAssetByDenom: (denom: string) => Asset | undefined;
    isLoading: boolean;
}

export const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

interface AssetsProviderProps {
    children: ReactNode;
}

export function AssetsProvider({ children }: AssetsProviderProps) {
    const [assetsMap, setAssetsMap] = useState<Map<string, Asset>>(new Map());
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

    const getAssetByDenom = (denom: string): Asset | undefined => {
        return assetsMap.get(denom);
    };

    // Derive assets array from map when needed
    const assets = Array.from(assetsMap.values());

    useEffect(() => {
        //initial context loading
        const init = async () => {
            const fetched = await getChainAssets()
            updateAssets(fetched)
            setIsLoading(false)
        }

        init();
    }, [])

    return (
        <AssetsContext.Provider value={{
            assets,
            assetsMap,
            updateAssets,
            getAssetByDenom,
            isLoading
        }}>
            {children}
        </AssetsContext.Provider>
    );
}