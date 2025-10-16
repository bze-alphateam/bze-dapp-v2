'use client';

import {createContext, useState, ReactNode, useEffect} from 'react';
import {Asset, IBCData} from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";
import {Market, MarketData} from "@/types/market";
import {createMarketId} from "@/utils/market";
import {getMarkets} from "@/query/markets";
import {getAllTickers, getMarketOrdersHistory} from "@/query/aggregator";
import {Coin} from "@bze/bzejs/cosmos/base/v1beta1/coin";
import BigNumber from "bignumber.js";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {getAddressBalances} from "@/query/bank";
import {Balance} from "@/types/balance";
import {isIbcDenom} from "@/utils/denom";
import {getChainNativeAssetDenom, getUSDCDenom} from "@/constants/assets";
import {getBZEUSDPrice} from "@/query/prices";

export interface AssetsContextType {
    //assets
    assetsMap: Map<string, Asset>;
    updateAssets: (newAssets: Asset[]) => void;

    marketsMap: Map<string, Market>;
    updateMarkets: (newMarkets: Market[]) => void;

    marketsDataMap: Map<string, MarketData>;
    updateMarketsData: (newMarkets: MarketData[]) => void;

    balancesMap: Map<string, Balance>;
    updateBalances: (newBalances: Coin[]) => void;

    // holds a map denom => USD price
    // assets with price 0 will be in this map
    // assets that are not in this map their USD value should not be displayed (example: USDC coin)
    usdPricesMap: Map<string, BigNumber>;

    //others
    isLoading: boolean;

    // holds a list of blockchains IBC details. It is populated from assets details.
    // WARNING: it can hold IBC details that are incomplete (missing chain.channelId or missing chain.counterparty.channelId)
    ibcChains: IBCData[]
}

export const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

interface AssetsProviderProps {
    children: ReactNode;
}

export function AssetsProvider({ children }: AssetsProviderProps) {
    const [assetsMap, setAssetsMap] = useState<Map<string, Asset>>(new Map());
    const [marketsMap, setMarketsMap] = useState<Map<string, Market>>(new Map());
    const [marketsDataMap, setMarketsDataMap] = useState<Map<string, MarketData>>(new Map());
    const [balancesMap, setBalancesMap] = useState<Map<string, Balance>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [ibcChains, setIbcChains] = useState<IBCData[]>([]);
    const [usdPricesMap, setUsdPricesMap] = useState<Map<string, BigNumber>>(new Map());

    const {address} = useChain(getChainName());

    const updateAssets = (newAssets: Asset[]) => {
        // Create map for efficient lookups
        const newMap = new Map<string, Asset>();
        const ibc = new Map<string, IBCData>();
        newAssets.forEach(asset => {
            newMap.set(asset.denom, asset);
            if (!isIbcDenom(asset.denom) || !asset.IBCData) {
                return
            }

            // we set ibcChains from these assets.
            // use a map to avoid duplicates
            ibc.set(asset.IBCData.chain.channelId, asset.IBCData);
        });

        setAssetsMap(newMap);
        setIbcChains(Array.from(ibc.values()));
    };

    const updateMarkets = (newMarkets: Market[]) => {
        const newMap = new Map<string, Market>();
        newMarkets.forEach(market => {
            newMap.set(createMarketId(market.base, market.quote), market);
        })

        setMarketsMap(newMap);
    }

    const updateMarketsData = (newMarkets: MarketData[]) => {
        const newMap = new Map<string, MarketData>();
        newMarkets.forEach(market => {
            newMap.set(market.market_id, market);
        })

        setMarketsDataMap(newMap);
    }

    const updateBalances = (newBalances: Coin[]) => {
        const newMap = new Map<string, Balance>();
        newBalances.forEach(balance => {
            newMap.set(balance.denom, {denom: balance.denom, amount: new BigNumber(balance.amount)});
        })

        setBalancesMap(newMap);
    }

    useEffect(() => {
        if (assetsMap.size === 0 || marketsDataMap.size === 0) return;

        const getLastPrice = async (marketId: string, fallback?: () => Promise<number>): Promise<BigNumber> => {
            //try to get price from the market data, using the last_price field (it only shows last 24h price)
            const mData = marketsDataMap.get(marketId)
            if (mData && mData.last_price > 0) {
                return new BigNumber(mData.last_price)
            }

            //if we couldn't find the last price in the market data, we'll try to get it from the trade history
            if (mData) {
                const tradeHistory = await getMarketOrdersHistory(marketId)
                if (tradeHistory.length > 0) {
                    return new BigNumber(tradeHistory[0].price)
                }
            }

            //if we couldn't find the last price in the market data or trade history, we'll try to get it from the ticker
            if (fallback) {
                return new BigNumber(await fallback())
            }

            //if we couldn't find the last price in the market data, trade history or ticker, we'll return 0
            return new BigNumber(0)
        }

        const loadPrices = async () => {
            const bzeDenom = getChainNativeAssetDenom()
            const usdcDenom = getUSDCDenom()

            //1. get the USD price for BZE
            const bzeUsdPrice = await getLastPrice(createMarketId(bzeDenom, usdcDenom), getBZEUSDPrice)

            //2. get the USD price for each asset
            const pricesMap = new Map<string, BigNumber>();
            pricesMap.set(bzeDenom, bzeUsdPrice)

            const existingAssets = Array.from(assetsMap.values())
            for (const asset of existingAssets) {
                if (asset.denom === bzeDenom || asset.denom === usdcDenom) continue

                let priceInUsd = new BigNumber(0)
                const usdMarket = marketsDataMap.get(createMarketId(asset.denom, usdcDenom))
                if (usdMarket) {
                    priceInUsd = await getLastPrice(createMarketId(asset.denom, usdcDenom))
                }

                const bzeMarket = marketsDataMap.get(createMarketId(asset.denom, bzeDenom))
                if (!bzeMarket || !bzeUsdPrice.gt(0)) {
                    // we dont have a BZE market, or BZE price is zero (BZE price should always be positive, but just in
                    // case) -> use the USD price (might be 0)
                    pricesMap.set(asset.denom, priceInUsd)
                    continue
                }

                const priceInBze = await getLastPrice(createMarketId(asset.denom, bzeDenom))
                if (!priceInBze.gt(0)) {
                    //we dont have a price in BZE on the BZE market -> use the USD price (might be 0)
                    pricesMap.set(asset.denom, priceInUsd)
                    continue
                }

                const priceInUsdFromBze = priceInBze.multipliedBy(bzeUsdPrice)
                if (!priceInUsd.gt(0)) {
                    //we dont have a USD price -> use the BZE price which surely is > 0
                    pricesMap.set(asset.denom, priceInUsdFromBze)
                    continue
                }

                //we have a USD market and a BZE market -> return the average of the two prices
                pricesMap.set(asset.denom, priceInUsd.plus(priceInUsdFromBze).dividedBy(2))
            }

            setUsdPricesMap(pricesMap)
        }

        loadPrices()
    }, [marketsDataMap, assetsMap]);

    useEffect(() => {
        setIsLoading(true)
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

    useEffect(() => {
        if (!address) return;

        const fetchBalances = async () => {
            const balances = await getAddressBalances(address);
            updateBalances(balances);
            setIsLoading(false);
        }

        fetchBalances()
    }, [address]);

    return (
        <AssetsContext.Provider value={{
            assetsMap,
            updateAssets,
            marketsMap,
            updateMarkets,
            isLoading,
            marketsDataMap,
            updateMarketsData,
            balancesMap,
            updateBalances,
            ibcChains,
            usdPricesMap,
        }}>
            {children}
        </AssetsContext.Provider>
    );
}