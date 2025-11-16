import BigNumber from "bignumber.js";
import { LiquidityPoolSDKType } from "@bze/bzejs/bze/tradebin/store";
import { toBigNumber } from "@/utils/amount";
import {SwapRouteResult} from "@/types/liquidity_pool";

interface RouteCache {
    result: SwapRouteResult;
    timestamp: number;
}

/**
 * Singleton service for AMM routing and swap calculations.
 * Caches optimal routes to improve performance when users switch between assets.
 */
class AmmRouter {
    private static instance: AmmRouter;
    private routeCache = new Map<string, RouteCache>();
    private routeMap: Map<string, Map<string, LiquidityPoolSDKType>> = new Map();

    private constructor() {}

    static getInstance(): AmmRouter {
        if (!AmmRouter.instance) {
            AmmRouter.instance = new AmmRouter();
        }
        return AmmRouter.instance;
    }

    /**
     * Updates the internal route map when pools change.
     * Should be called whenever liquidity pools are updated.
     * Clears all cached routes since pool reserves have changed.
     */
    updatePools(pools: LiquidityPoolSDKType[]): void {
        this.routeMap = this.mapLiquidityPoolRoutes(pools);
        this.clearCache(); // Clear cache since pool data is now stale
    }

    /**
     * Maps liquidity pool routes for efficient path finding.
     */
    private mapLiquidityPoolRoutes(
        pools: LiquidityPoolSDKType[]
    ): Map<string, Map<string, LiquidityPoolSDKType>> {
        const routeMap = new Map<string, Map<string, LiquidityPoolSDKType>>();

        for (const pool of pools) {
            // Add base -> quote mapping
            if (!routeMap.has(pool.base)) {
                routeMap.set(pool.base, new Map());
            }
            routeMap.get(pool.base)!.set(pool.quote, pool);

            // Add quote -> base mapping (bidirectional)
            if (!routeMap.has(pool.quote)) {
                routeMap.set(pool.quote, new Map());
            }
            routeMap.get(pool.quote)!.set(pool.base, pool);
        }

        return routeMap;
    }

    /**
     * Finds the optimal swap route, using cache if available.
     *
     * @param fromDenom - Source denom
     * @param toDenom - Destination denom
     * @param amountIn - Input amount
     * @param maxHops - Maximum number of hops allowed
     * @param useCache - Whether to use cached routes (default: true)
     * @returns Route information or null if no route found
     */
    findOptimalRoute(
        fromDenom: string,
        toDenom: string,
        amountIn: BigNumber,
        maxHops: number,
        useCache: boolean = true
    ): SwapRouteResult | null {
        const cacheKey = this.getCacheKey(fromDenom, toDenom, maxHops);

        // Check cache first
        if (useCache) {
            const cached = this.routeCache.get(cacheKey);
            if (cached) {
                // Return cached route with recalculated amounts
                return {
                    ...cached.result,
                    ...this.calculateRouteOutput(cached.result.pools, cached.result.path, amountIn)
                };
            }
        }

        // Calculate new route
        const result = this.findOptimalSwapRoute(fromDenom, toDenom, amountIn, maxHops);

        // Cache the result
        if (result) {
            this.routeCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });
        }

        return result;
    }

    /**
     * Calculates output for an existing route with a new input amount.
     */
    calculateRouteOutput(
        pools: LiquidityPoolSDKType[],
        path: string[],
        amountIn: BigNumber
    ): Omit<SwapRouteResult, 'route' | 'path' | 'pools'> {
        let currentAmount = amountIn;
        const fees: BigNumber[] = [];

        // Simulate the swap through each pool
        for (let i = 0; i < pools.length; i++) {
            const pool = pools[i];
            const currentDenom = path[i];
            const isBaseToQuote = pool.base === currentDenom;

            const { amountOut, fee } = this.calculateSwapOutput(pool, currentAmount, isBaseToQuote);
            fees.push(fee);
            currentAmount = amountOut;
        }

        const expectedOutput = currentAmount;

        // Calculate theoretical outputs for fees and price impact
        const theoretical = this.calculateTheoreticalOutputs(pools, path, amountIn);

        const totalFees = theoretical.withoutFees.minus(theoretical.withFees);
        const priceImpact = theoretical.withFees.isZero()
            ? toBigNumber(0)
            : theoretical.withFees.minus(expectedOutput).dividedBy(theoretical.withFees).multipliedBy(100);

        return {
            expectedOutput,
            priceImpact,
            totalFees,
            feesPerHop: fees
        };
    }

    /**
     * Clears all cached routes or routes matching a specific filter.
     *
     * @param filter - Optional filter function to selectively clear routes
     *
     * @example
     * // Clear all routes
     * ammRouter.clearCache();
     *
     * // Clear routes older than 5 minutes
     * ammRouter.clearCache((key, cache) => Date.now() - cache.timestamp > 300000);
     *
     * // Clear routes involving a specific denom
     * ammRouter.clearCache((key) => key.includes('ubze'));
     */
    clearCache(filter?: (key: string, cache: RouteCache) => boolean): void {
        if (!filter) {
            this.routeCache.clear();
            return;
        }

        for (const [key, cache] of this.routeCache.entries()) {
            if (filter(key, cache)) {
                this.routeCache.delete(key);
            }
        }
    }

    /**
     * Gets cache statistics for monitoring.
     */
    getCacheStats() {
        return {
            size: this.routeCache.size,
            keys: Array.from(this.routeCache.keys())
        };
    }

    /**
     * Calculates theoretical outputs (without slippage) for a route.
     * Returns output with no fees and output with fees applied.
     */
    private calculateTheoreticalOutputs(
        pools: LiquidityPoolSDKType[],
        path: string[],
        amountIn: BigNumber
    ): { withoutFees: BigNumber; withFees: BigNumber } {
        let theoreticalOutputNoFees = amountIn;
        let theoreticalOutputWithFees = amountIn;

        for (let i = 0; i < pools.length; i++) {
            const pool = pools[i];
            const currentDenom = path[i];
            const isBaseToQuote = pool.base === currentDenom;

            const reserveIn = toBigNumber(isBaseToQuote ? pool.reserve_base : pool.reserve_quote);
            const reserveOut = toBigNumber(isBaseToQuote ? pool.reserve_quote : pool.reserve_base);
            const midPrice = reserveOut.dividedBy(reserveIn);

            // Output without fees
            theoreticalOutputNoFees = theoreticalOutputNoFees.multipliedBy(midPrice);

            // Output with fees
            const fee = toBigNumber(pool.fee);
            theoreticalOutputWithFees = theoreticalOutputWithFees
                .multipliedBy(toBigNumber(1).minus(fee))
                .multipliedBy(midPrice);
        }

        return {
            withoutFees: theoreticalOutputNoFees,
            withFees: theoreticalOutputWithFees
        };
    }

    /**
     * Calculates the output amount for a swap through a single pool using constant product formula.
     */
    private calculateSwapOutput(
        pool: LiquidityPoolSDKType,
        amountIn: BigNumber,
        isBaseToQuote: boolean
    ): { amountOut: BigNumber; fee: BigNumber } {
        const fee = toBigNumber(pool.fee);
        const reserveIn = toBigNumber(isBaseToQuote ? pool.reserve_base : pool.reserve_quote);
        const reserveOut = toBigNumber(isBaseToQuote ? pool.reserve_quote : pool.reserve_base);

        // Fee amount
        const feeAmount = amountIn.multipliedBy(fee);

        // Amount after fee
        const amountInAfterFee = amountIn.minus(feeAmount);

        // Constant product formula: (amountIn * reserveOut) / (reserveIn + amountIn)
        const amountOut = amountInAfterFee
            .multipliedBy(reserveOut)
            .dividedBy(reserveIn.plus(amountInAfterFee));

        return { amountOut, fee: feeAmount };
    }

    /**
     * Finds the optimal swap route using Dijkstra's algorithm to maximize output.
     */
    private findOptimalSwapRoute(
        fromDenom: string,
        toDenom: string,
        amountIn: BigNumber,
        maxHops: number
    ): SwapRouteResult | null {
        if (fromDenom === toDenom) {
            return null;
        }

        // Priority queue: stores route information as we explore paths
        interface RouteNode {
            denom: string;
            amount: BigNumber;
            path: string[];
            poolIds: string[];
            pools: LiquidityPoolSDKType[];
            fees: BigNumber[];
            hops: number;
        }

        const queue: RouteNode[] = [{
            denom: fromDenom,
            amount: amountIn,
            path: [fromDenom],
            poolIds: [],
            pools: [],
            fees: [],
            hops: 0
        }];

        // Track best amount received at each denom
        const bestAmounts = new Map<string, BigNumber>();
        bestAmounts.set(fromDenom, amountIn);

        let bestRoute: RouteNode | null = null;

        while (queue.length > 0) {
            // Sort to get the route with maximum amount (greedy approach)
            queue.sort((a, b) => b.amount.comparedTo(a.amount) ?? 0);
            const current = queue.shift()!;

            // If we've reached the destination, check if it's the best route
            if (current.denom === toDenom) {
                if (!bestRoute || current.amount.isGreaterThan(bestRoute.amount)) {
                    bestRoute = current;
                }
                continue;
            }

            // If we've exceeded max hops, skip
            if (current.hops >= maxHops) {
                continue;
            }

            // Explore neighbors
            const neighbors = this.routeMap.get(current.denom);
            if (!neighbors) continue;

            for (const [nextDenom, pool] of neighbors.entries()) {
                // Avoid cycles
                if (current.path.includes(nextDenom)) {
                    continue;
                }

                // Determine swap direction
                const isBaseToQuote = pool.base === current.denom;

                // Calculate output for this hop
                const { amountOut, fee } = this.calculateSwapOutput(pool, current.amount, isBaseToQuote);

                // Skip if we get zero or negative output
                if (amountOut.lte(0)) {
                    continue;
                }

                // Check if this is a better route to nextDenom
                const previousBest = bestAmounts.get(nextDenom);
                if (previousBest && amountOut.lte(previousBest)) {
                    continue;
                }

                bestAmounts.set(nextDenom, amountOut);

                // Add to queue
                queue.push({
                    denom: nextDenom,
                    amount: amountOut,
                    path: [...current.path, nextDenom],
                    poolIds: [...current.poolIds, pool.id],
                    pools: [...current.pools, pool],
                    fees: [...current.fees, fee],
                    hops: current.hops + 1
                });
            }
        }

        if (!bestRoute) {
            return null;
        }

        // Calculate theoretical outputs for fees and price impact
        const theoretical = this.calculateTheoreticalOutputs(bestRoute.pools, bestRoute.path, amountIn);

        const totalFees = theoretical.withoutFees.minus(theoretical.withFees);
        const priceImpact = theoretical.withFees.isZero()
            ? toBigNumber(0)
            : theoretical.withFees.minus(bestRoute.amount).dividedBy(theoretical.withFees).multipliedBy(100);

        return {
            route: bestRoute.poolIds,
            path: bestRoute.path,
            pools: bestRoute.pools,
            expectedOutput: bestRoute.amount,
            priceImpact,
            totalFees,
            feesPerHop: bestRoute.fees
        };
    }

    /**
     * Generates a cache key for a route.
     */
    private getCacheKey(fromDenom: string, toDenom: string, maxHops: number): string {
        return `${fromDenom}_${toDenom}_${maxHops}`;
    }
}

export const ammRouter = AmmRouter.getInstance();
