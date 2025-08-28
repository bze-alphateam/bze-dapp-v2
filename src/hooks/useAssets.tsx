import { useContext } from 'react';
import { AssetsContext, AssetsContextType } from '@/contexts/assets_context';
import {Asset} from "@/types/asset";
import {getChainNativeAssetDenom} from "@/constants/assets";

// Base hook to access context (private)
export function useAssetsContext(): AssetsContextType {
    const context = useContext(AssetsContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetsProvider');
    }
    return context;
}

// Hook for reading assets data
export function useAssets() {
    const { assetsMap, isLoading } = useAssetsContext();

    const getAssetByDenom = (denom: string): Asset | undefined => {
        return assetsMap.get(denom);
    };

    const nativeAsset = assetsMap.get(getChainNativeAssetDenom())

    // Derive assets array from map when needed
    const assets = Array.from(assetsMap.values());

    return {
        assets,
        getAssetByDenom,
        isLoading,
        nativeAsset
    };
}

// Hook for managing/writing assets data
export function useAssetsManager() {
    const { updateAssets, isLoading } = useAssetsContext();
    return {
        updateAssets,
        isLoading
    };
}