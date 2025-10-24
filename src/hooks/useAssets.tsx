import {useCallback, useContext, useMemo} from 'react';
import { AssetsContext, AssetsContextType } from '@/contexts/assets_context';
import {getChainNativeAssetDenom} from "@/constants/assets";
import {Asset} from "@/types/asset";
import {truncateDenom} from "@/utils/denom";

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

    const nativeAsset = useMemo(() =>
            assetsMap.get(getChainNativeAssetDenom()) as Asset,
        [assetsMap]
    );

    const assets = useMemo(() =>
            Array.from(assetsMap.values()),
        [assetsMap]
    );

    const isVerifiedAsset = useCallback((denom: string) => {
        const asset = assets.find(a => a.denom === denom)
        if (!asset) {
            return false
        }

        return asset.verified
    }, [assets])

    const denomTicker = useCallback((denom: string) => {
        const asset = assets.find(a => a.denom === denom)
        if (!asset) {
            return truncateDenom(denom)
        }

        return asset.ticker
    }, [assets])

    return {
        assets,
        isLoading,
        nativeAsset,
        isVerifiedAsset,
        denomTicker,
    };
}

export function useAsset(denom: string) {
    const { assetsMap, isLoading } = useAssetsContext();

    const asset = useMemo(() =>
            assetsMap.get(denom),
        [assetsMap, denom]
    );

    return {
        asset,
        isLoading,
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

export function useIBCChains() {
    const {ibcChains, isLoading} = useAssetsContext()

    return {
        ibcChains,
        isLoading
    }
}
