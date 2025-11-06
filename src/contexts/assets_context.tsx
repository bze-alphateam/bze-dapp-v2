'use client';

import {createContext, useState, ReactNode, useEffect, useCallback} from 'react';
import {Asset, IBCData} from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";
import {Market, MarketData} from '@/types/market';
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
import {EpochInfoSDKType} from "@bze/bzejs/bze/epochs/epoch";
import {getEpochsInfo} from "@/query/epoch";
import {CONNECTION_TYPE_NONE, ConnectionType} from "@/types/settings";

export interface AssetsContextType {
    //assets
    assetsMap: Map<string, Asset>;
    updateAssets: () => Promise<Map<string, Asset>>;

    marketsMap: Map<string, Market>;
    updateMarkets: () => void;

    marketsDataMap: Map<string, MarketData>;
    updateMarketsData: () => Promise<Map<string, MarketData>>;

    balancesMap: Map<string, Balance>;
    updateBalances: () => void;

    // holds a map denom => USD price
    // assets with price 0 will be in this map
    // assets that are not in this map their USD value should not be displayed (example: USDC coin)
    usdPricesMap: Map<string, BigNumber>;
    updatePrices: (m: Map<string, MarketData>, a: Map<string, Asset>) => void;

    //others
    isLoading: boolean;
    isLoadingPrices: boolean;

    // holds a list of blockchains IBC details. It is populated from assets details.
    // WARNING: it can hold IBC details that are incomplete (missing chain.channelId or missing chain.counterparty.channelId)
    ibcChains: IBCData[]

    epochs: Map<string, EpochInfoSDKType>
    updateEpochs: () => void;

    connectionType: ConnectionType;
    updateConnectionType: (conn: ConnectionType) => void;
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
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);
    const [epochs, setEpochs] = useState<Map<string, EpochInfoSDKType>>(new Map());
    const [connectionType, setConnectionType] = useState<ConnectionType>(CONNECTION_TYPE_NONE);

    const {address} = useChain(getChainName());

    const doUpdateAssets = useCallback((newAssets: Asset[]) => {
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
            if (asset.IBCData.chain.channelId === "") {
                return;
            }

            ibc.set(asset.IBCData.chain.channelId, asset.IBCData);
        });

        setAssetsMap(newMap);
        setIbcChains(Array.from(ibc.values()));

        return newMap
    }, []);
    const doUpdateMarkets = useCallback((newMarkets: Market[]) => {
        const newMap = new Map<string, Market>();
        newMarkets.forEach(market => {
            newMap.set(createMarketId(market.base, market.quote), market);
        })

        setMarketsMap(newMap);
    }, []);
    const doUpdateMarketsData = useCallback((newMarkets: MarketData[]) => {
        const newMap = new Map<string, MarketData>();
        newMarkets.forEach(market => {
            newMap.set(market.market_id, market);
        })

        setMarketsDataMap(newMap);

        return newMap
    }, []);
    const doUpdateBalances = useCallback((newBalances: Coin[]) => {
        const newMap = new Map<string, Balance>();
        newBalances.forEach(balance => {
            newMap.set(balance.denom, {denom: balance.denom, amount: new BigNumber(balance.amount)});
        })

        setBalancesMap(newMap);
    }, []);
    const doUpdatePrices = useCallback(async (m: Map<string, MarketData>, a: Map<string, Asset>) => {
        if (a.size === 0 || m.size === 0) return;
        setIsLoadingPrices(true)

        const getLastPrice = async (marketId: string, fallback?: () => Promise<number>): Promise<BigNumber> => {
            //try to get price from the market data, using the last_price field (it only shows last 24h price)
            const mData = m.get(marketId)
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

        const bzeDenom = getChainNativeAssetDenom()
        const usdcDenom = getUSDCDenom()

        //1. get the USD price for BZE
        const bzeUsdPrice = await getLastPrice(createMarketId(bzeDenom, usdcDenom), getBZEUSDPrice)

        //2. get the USD price for each asset
        const pricesMap = new Map<string, BigNumber>();
        pricesMap.set(bzeDenom, bzeUsdPrice)

        const existingAssets = Array.from(a.values())
        for (const asset of existingAssets) {
            if (asset.denom === bzeDenom || asset.denom === usdcDenom) continue

            let priceInUsd = new BigNumber(0)
            const usdMarket = m.get(createMarketId(asset.denom, usdcDenom))
            if (usdMarket) {
                priceInUsd = await getLastPrice(createMarketId(asset.denom, usdcDenom))
            }

            const bzeMarket = m.get(createMarketId(asset.denom, bzeDenom))
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

            // Note: Aggregator has the price already transformed (and the amounts - not that it matters)
            // TODO: If the price is obtained from the blockchain (the market pair history) we need to make sure that
            //  price is converted if the two assets in the market pair have different exponent (different decimals)

            //we have a USD market and a BZE market -> return the average of the two prices
            pricesMap.set(asset.denom, priceInUsd.plus(priceInUsdFromBze).dividedBy(2))
        }

        setUsdPricesMap(pricesMap)
        setIsLoadingPrices(false)
    }, []);
    const doUpdateEpochs = useCallback((newEpochs: EpochInfoSDKType[]) => {
        const newMap = new Map<string, EpochInfoSDKType>();
        newEpochs.forEach(epoch => {
            newMap.set(epoch.identifier, epoch);
        })

        setEpochs(newMap);
    }, []);

    const updateAssets = useCallback(async () => {
        const newAssets = await getChainAssets()
        return doUpdateAssets(newAssets)
    }, [doUpdateAssets]);
    const updateMarkets = useCallback(async () => {
        const newMarkets = await getMarkets()
        doUpdateMarkets(newMarkets)
    }, [doUpdateMarkets]);
    const updateMarketsData = useCallback(async () => {
        const newMarkets = await getAllTickers()

        return doUpdateMarketsData(newMarkets)
    }, [doUpdateMarketsData]);
    const updateBalances = useCallback(async () => {
        if (!address) return;

        const newBalances = await getAddressBalances(address)
        doUpdateBalances(newBalances)
    }, [doUpdateBalances, address]);
    const updateEpochs = useCallback(async () => {
        const newEpochs = await getEpochsInfo()
        doUpdateEpochs(newEpochs.epochs)
    }, [doUpdateEpochs]);
    const updateConnectionType = useCallback((conn: ConnectionType) => {
        setConnectionType(conn)
    }, [])

    useEffect(() => {
        setIsLoading(true)
        //initial context loading
        const init = async () => {
            const [assets, markets, tickers, epochsInfo] = await Promise.all([getChainAssets(), getMarkets(), getAllTickers(), getEpochsInfo()])
            const updatedAssets = doUpdateAssets(assets)
            doUpdateMarkets(markets)
            const updatedMarketData = doUpdateMarketsData(tickers)

            await doUpdatePrices(updatedMarketData, updatedAssets)
            doUpdateEpochs(epochsInfo.epochs)

            setIsLoading(false)
        }

        init();
    }, [doUpdateAssets, doUpdateMarkets, doUpdateMarketsData, doUpdatePrices, doUpdateEpochs])

    useEffect(() => {
        doUpdatePrices(marketsDataMap, assetsMap)
    }, [marketsDataMap, assetsMap, doUpdatePrices]);

    useEffect(() => {
        if (!address) {
            doUpdateBalances([]);
            return
        }

        const fetchBalances = async () => {
            setIsLoading(true)
            const balances = await getAddressBalances(address);
            doUpdateBalances(balances);
            setIsLoading(false);
        }

        fetchBalances()
    }, [address, doUpdateBalances]);

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
            isLoadingPrices,
            epochs,
            updateEpochs,
            updatePrices: doUpdatePrices,
            connectionType,
            updateConnectionType,
        }}>
            {children}
        </AssetsContext.Provider>
    );
}