import { useMemo } from "react";
import { useLiquidityPools } from "./useLiquidityPools";
import { getChainNativeAssetDenom } from "@/constants/assets";
import { useAssetsContext } from "./useAssets";
import {toBigNumber} from "@/utils/amount";

const MIN_LIQUIDITY_FOR_FEE_TOKEN = 50000000000;

/**
 * Hook to get available fee tokens (tokens that have a liquidity pool with the chain native denom)
 */
export function useFeeTokens() {
    const { pools, isLoading: poolsLoading } = useLiquidityPools();
    const { assetsMap, isLoading: assetsLoading } = useAssetsContext();
    const nativeDenom = getChainNativeAssetDenom();

    // Get all fee tokens (tokens with LP paired with native denom)
    const feeTokens = useMemo(() => {
        if (poolsLoading || assetsLoading) {
            return [];
        }

        const feeTokenDenoms = new Set<string>();

        // Find all pools that have the native denom as either base or quote
        pools.forEach(pool => {
            if (pool.base === nativeDenom && toBigNumber(pool.reserve_base).gt(MIN_LIQUIDITY_FOR_FEE_TOKEN)) {
                feeTokenDenoms.add(pool.quote);
            } else if (pool.quote === nativeDenom && toBigNumber(pool.reserve_quote).gt(MIN_LIQUIDITY_FOR_FEE_TOKEN)) {
                feeTokenDenoms.add(pool.base);
            }
        });

        // Convert denoms to asset objects
        const tokens = Array.from(feeTokenDenoms)
            .map(denom => assetsMap.get(denom))
            .filter(asset => asset !== undefined)
            .sort((a, b) => {
                if (!a || !b) return 0;
                return a.denom.localeCompare(b.denom);
            })

        const bzeAsset = assetsMap.get(nativeDenom);
        if (!bzeAsset) {
            return tokens;
        }

        return [bzeAsset, ...tokens];
    }, [pools, poolsLoading, assetsLoading, nativeDenom, assetsMap]);

    return {
        feeTokens,
        isLoading: poolsLoading || assetsLoading,
        nativeDenom
    };
}
