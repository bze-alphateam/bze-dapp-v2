import { useCallback, useEffect, useRef } from 'react';
import {getSettings} from "@/storage/settings";
import {useAssetsContext} from "@/hooks/useAssets";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {addDebounce, addMultipleDebounce} from "@/utils/debounce";

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

export interface Attribute {
    key: string;
    value: string;
    index: boolean;
}

export interface TendermintEvent {
    type: string;
    attributes: Attribute[];
}

const isAddressTransfer = (address: string, event: TendermintEvent) => {
    if (address === '' || event.type !== 'transfer') return false;

    return event.attributes.find(attribute => attribute.value === address) !== undefined;
};

const isOrderExecutedEvent = (event: TendermintEvent) => {
    return event.type.includes('bze.tradebin.OrderExecutedEvent');
};

export function useBlockchainListener() {
    const { updateBalances, updateMarketsData } = useAssetsContext();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);
    const subscribedToTxRef = useRef(false);
    const previousAddressRef = useRef<string | undefined>(undefined);
    const maxReconnectAttempts = 10;
    const {address} = useChain(getChainName())

    const onBlockEvent = useCallback((events: TendermintEvent[]) => {
        if (!events) return;

        for (const event of events) {
            if (isAddressTransfer(address ?? '', event)) {
                //use debounce to avoid multiple calls to updateBalances
                addDebounce('onAddressTransfer', 1000, updateBalances)
                continue;
            }

            if (isOrderExecutedEvent(event)) {
                // the market data is fetched from getbze API so we need to give the web server some time to do it properly
                addMultipleDebounce('onTradebinEvent', 1500, updateMarketsData, 2)
            }
        }
    }, [address, updateBalances, updateMarketsData])

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

            // Only reconnect if it wasn't a manual close (code 1000)
            if (event.code !== 1000 && shouldReconnectRef.current) {
                reconnect();
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
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
}