'use client';

import {createContext, useState, ReactNode, useEffect} from 'react';
import { Asset } from '@/types/asset';
import {getChainAssets} from "@/service/assets_factory";
import {Market, MarketData} from "@/types/market";
import {createMarketId} from "@/utils/market";
import {getMarkets} from "@/query/markets";
import {getAllTickers} from "@/query/aggregator";
import {Coin} from "@bze/bzejs/cosmos/base/v1beta1/coin";
import BigNumber from "bignumber.js";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {getAddressBalances} from "@/query/bank";

export interface AssetsContextType {
    //assets
    assetsMap: Map<string, Asset>;
    updateAssets: (newAssets: Asset[]) => void;

    marketsMap: Map<string, Market>;
    updateMarkets: (newMarkets: Market[]) => void;

    marketsDataMap: Map<string, MarketData>;
    updateMarketsData: (newMarkets: MarketData[]) => void;

    balancesMap: Map<string, BigNumber>;
    updateBalances: (newBalances: Coin[]) => void;

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
    const [balancesMap, setBalancesMap] = useState<Map<string, BigNumber>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const {address} = useChain(getChainName());

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

    const updateBalances = (newBalances: Coin[]) => {
        const newMap = new Map<string, BigNumber>();
        newBalances.forEach(balance => {
            newMap.set(balance.denom, BigNumber(balance.amount));
        })

        setBalancesMap(newMap);
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
            updateBalances
        }}>
            {children}
        </AssetsContext.Provider>
    );
}