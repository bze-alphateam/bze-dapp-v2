import {useCallback, useEffect, useRef, useState} from 'react';
import {getSettings} from "@/storage/settings";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {blockchainEventManager} from "@/service/blockchain_event_manager";
import {
    CURRENT_WALLET_BALANCE_EVENT,
    ORDER_BOOK_CHANGED_EVENT,
    ORDER_EXECUTED_EVENT,
    SUPPLY_CHANGED_EVENT,
    TendermintEvent
} from "@/types/events";
import {parseCoins} from "@cosmjs/amino";
import {coins} from "@cosmjs/stargate";
import {getChainNativeAssetDenom} from "@/constants/assets";

const BLOCK_SUBSCRIPTION_ID = 1;
const TX_RECIPIENT_SUBSCRIPTION_ID = 2;
const TX_SENDER_SUBSCRIPTION_ID = 3;

const buildSubscribePayload = (id: number, query: string) => {
    return {
        jsonrpc: "2.0",
        method: "subscribe",
        id: id,
        params: {
            query: query
        }
    };
}

const buildUnsubscribePayload = (id: number, query: string) => {
    return {
        jsonrpc: "2.0",
        method: "unsubscribe",
        id: id,
        params: {
            query: query
        }
    };
}

const getMarketId = (event: TendermintEvent) => {
    // market id contains " so we have to remove them
    return event.attributes.find(attribute => attribute.key === 'market_id')?.value.replaceAll('"', "");
}

const isAddressTransfer = (address: string, event: TendermintEvent) => {
    if (address === '' || event.type !== 'transfer') return false;

    return event.attributes.find(attribute => attribute.value === address) !== undefined;
};

const isOrderBookEvent = (event: TendermintEvent) => {
    return event.type.includes('bze.tradebin.Order');
};

const isOrderExecutedEvent = (event: TendermintEvent) => {
    return event.type.includes('bze.tradebin.OrderExecutedEvent');
};

const isCoinbaseEvent = (event: TendermintEvent) => {
    return event.type.includes('coinbase');
};

const isBurnEvent = (event: TendermintEvent) => {
    return event.type.includes('burn');
};

const getMintedAmount = (event: TendermintEvent) => {
    const defaultCoin = coins(0, getChainNativeAssetDenom());
    try {
        const amountAttribute = event.attributes.find(attribute => attribute.key === 'amount');
        return amountAttribute ? parseCoins(amountAttribute.value) : defaultCoin
    }catch (e) {
        console.error("Failed to parse minted amount from coinbase event", e)
        return defaultCoin
    }
};

export function useBlockchainListener() {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);
    const subscribedToTxRef = useRef(false);
    const previousAddressRef = useRef<string | undefined>(undefined);
    const [isConnected, setIsConnected] = useState(false);

    const maxReconnectAttempts = 10;
    const {address} = useChain(getChainName())

    //filters tendermint events and dispatches internal ones
    const onBlockEvent = useCallback((events: TendermintEvent[]) => {
        if (!events) return;

        for (const event of events) {
            if (isAddressTransfer(address ?? '', event)) {
                //the current address balance changed
                blockchainEventManager.emit(CURRENT_WALLET_BALANCE_EVENT)
                continue;
            }

            if (isBurnEvent(event)) {
                blockchainEventManager.emit(SUPPLY_CHANGED_EVENT)
                continue;
            }

            if (isCoinbaseEvent(event)) {
                //every block a new mint event is emitted for newly minted coins from the native asset. These coins are
                //the rewards for validators and delegators (inflation).
                //avoid emitting a supply changed event for the native asset because it will be emitted for every block.
                const mintedAmount = getMintedAmount(event);
                for (const coin of mintedAmount) {
                    if (coin.denom !== getChainNativeAssetDenom()) {
                        console.log(`Minted ${coin.amount} ${coin.denom}`)
                        // if at least 1 coin was minted that is not the native asset, we should emit ONLY ONE
                        // supply changed event.
                        blockchainEventManager.emit(SUPPLY_CHANGED_EVENT)
                        break;
                    }
                }
                continue;
            }

            //add more events not related to markets here, before the market id is extracted

            const marketId = getMarketId(event)
            if (!marketId) continue;
            //without market id we should not continue

            if (isOrderBookEvent(event)) {
                blockchainEventManager.emit(ORDER_BOOK_CHANGED_EVENT, {marketId: marketId})
                if (isOrderExecutedEvent(event)) {
                    blockchainEventManager.emit(ORDER_EXECUTED_EVENT, {marketId: marketId})
                }
            }
        }
    }, [address])

    const subscribeTxEvents = useCallback((walletAddress: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (subscribedToTxRef.current) return;
        if (!walletAddress || walletAddress === '') return;

        // Subscribe to recipient events
        const recipientQuery = `tm.event='Tx' AND transfer.recipient='${walletAddress}'`;
        const recipientPayload = buildSubscribePayload(TX_RECIPIENT_SUBSCRIPTION_ID, recipientQuery);
        wsRef.current.send(JSON.stringify(recipientPayload));

        // Subscribe to sender events
        const senderQuery = `tm.event='Tx' AND transfer.sender='${walletAddress}'`;
        const senderPayload = buildSubscribePayload(TX_SENDER_SUBSCRIPTION_ID, senderQuery);
        wsRef.current.send(JSON.stringify(senderPayload));

        subscribedToTxRef.current = true;
    }, []);

    const unsubscribeTxEvents = useCallback((walletAddress: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!subscribedToTxRef.current) return;

        // Unsubscribe from recipient events
        const recipientQuery = `tm.event='Tx' AND transfer.recipient='${walletAddress}'`;
        const recipientPayload = buildUnsubscribePayload(TX_RECIPIENT_SUBSCRIPTION_ID, recipientQuery);
        wsRef.current.send(JSON.stringify(recipientPayload));

        // Unsubscribe from sender events
        const senderQuery = `tm.event='Tx' AND transfer.sender='${walletAddress}'`;
        const senderPayload = buildUnsubscribePayload(TX_SENDER_SUBSCRIPTION_ID, senderQuery);
        wsRef.current.send(JSON.stringify(senderPayload));

        subscribedToTxRef.current = false;
    }, []);

    const reconnect = useCallback(() => {
        if (!shouldReconnectRef.current) return;

        reconnectAttemptsRef.current++;

        if (reconnectAttemptsRef.current > maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);

        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
                connectWebSocket();
            }
        }, delay);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // WebSocket connection logic here
    const connectWebSocket = useCallback(() => {
        const settings = getSettings()
        if (!shouldReconnectRef.current) return;

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close(1000, 'Reconnecting');
            wsRef.current = null;
        }

        subscribedToTxRef.current = false;
        wsRef.current = new WebSocket(`${settings.endpoints.rpcEndpoint}/websocket`);

        wsRef.current.onopen = () => {
            // Subscribe to NewBlock events
            const blockPayload = buildSubscribePayload(BLOCK_SUBSCRIPTION_ID, "tm.event='NewBlock'");
            wsRef.current?.send(JSON.stringify(blockPayload));

            // Subscribe to Tx events if address is available
            if (address && address !== '') {
                subscribeTxEvents(address);
            }

            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;
            setIsConnected(true); // Set connected
            console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            //finalize block events
            if (data?.result?.data?.value?.result_finalize_block?.events) {
                onBlockEvent(data.result.data.value.result_finalize_block.events)
            }

            //tx events from NewBlock
            if (data?.result?.data?.value?.txs_results) {
                for (const txResult of data.result.data.value.txs_results) {
                    if (txResult?.events) {
                        onBlockEvent(txResult.events)
                    }
                }
            }

            //tx events from Tx subscription
            if (data?.result?.data?.value?.TxResult?.result?.events) {
                onBlockEvent(data.result.data.value.TxResult.result.events)
            }
        };

        wsRef.current.onclose = (event) => {
            console.log('WebSocket disconnected', event.code, event.reason);
            subscribedToTxRef.current = false;
            setIsConnected(false);

            // Only reconnect if it wasn't a manual close (code 1000)
            if (event.code !== 1000 && shouldReconnectRef.current) {
                reconnect();
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
            // Close the connection to trigger reconnect via onclose
            wsRef.current?.close();
        };
    }, [reconnect, address, subscribeTxEvents, onBlockEvent]);

    // Handle address changes
    useEffect(() => {
        const currentAddress = address ?? '';
        const previousAddress = previousAddressRef.current ?? '';

        // Address changed
        if (currentAddress !== previousAddress) {
            // Unsubscribe from old address
            if (previousAddress !== '') {
                unsubscribeTxEvents(previousAddress);
            }

            // Subscribe to new address
            if (currentAddress !== '') {
                subscribeTxEvents(currentAddress);
            }

            previousAddressRef.current = currentAddress;
        }
    }, [address, subscribeTxEvents, unsubscribeTxEvents]);

    useEffect(() => {
        shouldReconnectRef.current = true;
        connectWebSocket();

        // Cleanup
        return () => {
            shouldReconnectRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
                wsRef.current = null;
            }
        };
    }, [connectWebSocket]);

    return {
        isConnected,
    };
}