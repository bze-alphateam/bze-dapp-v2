'use client';

import { useBlockchainListener } from '@/hooks/useBlockchainListener';
import {useEffect} from "react";
import {useAssetsContext} from "@/hooks/useAssets";
import {blockchainEventManager} from "@/service/blockchain_event_manager";
import {CURRENT_WALLET_BALANCE_EVENT, ORDER_EXECUTED_EVENT} from "@/types/events";
import {addDebounce, addMultipleDebounce} from "@/utils/debounce";

export function BlockchainListenerWrapper() {
    const {isConnected} = useBlockchainListener();
    const {updateBalances, updateMarketsData} = useAssetsContext()

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout;
        const unsubscribers: (() => void)[] = [];
        if (!isConnected) {
            pollingInterval = setInterval(() => {
                updateBalances()
                updateMarketsData()
            }, 30 * 1000)
        } else {
            //on balance change refresh balances
            const balanceUnsubscribe = blockchainEventManager.subscribe(CURRENT_WALLET_BALANCE_EVENT, () => {
                //use debounce to avoid multiple calls to updateBalances
                addDebounce('refresh-wallet-func', 1000, updateBalances)
            })
            //on ANY market change refresh market data
            const marketUnsubscribe = blockchainEventManager.subscribe(ORDER_EXECUTED_EVENT, () => {
                //use debounce to avoid multiple calls to updateMarketsData
                addMultipleDebounce('refresh-market-data-func', 1500, updateMarketsData, 2)
            })

            unsubscribers.push(
                balanceUnsubscribe,
                marketUnsubscribe
            )
        }

        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval)
            }

            unsubscribers.forEach(unsubscribe => unsubscribe())
        };
    }, [isConnected, updateBalances, updateMarketsData]);

    return null; // This component renders nothing, just runs the hook
}