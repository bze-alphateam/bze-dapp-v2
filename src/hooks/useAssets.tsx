import { useContext } from 'react';
import { AssetsContext, AssetsContextType } from '@/contexts/assets_context';

// Base hook to access context (private)
function useAssetsContext(): AssetsContextType {
    const context = useContext(AssetsContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetsProvider');
    }
    return context;
}

// Hook for reading assets data
export function useAssets() {
    const { assets, getAssetByDenom, isLoading } = useAssetsContext();
    return {
        assets,
        getAssetByDenom,
        isLoading
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