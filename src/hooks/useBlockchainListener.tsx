import { useCallback, useEffect, useRef } from 'react';
import { useAssetsManager } from './useAssets';
import {getSettings} from "@/storage/settings";

const id = 1;
const query = `tm.event = 'NewBlock'`

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

export function useBlockchainListener() {
    const { updateAssets } = useAssetsManager();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(true);
    const maxReconnectAttempts = 10;

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
    }, []); // No dependencies needed as it only uses refs

    // WebSocket connection logic here
    const connectWebSocket = useCallback(() => {
        const settings = getSettings()
        if (!shouldReconnectRef.current) return;

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close(1000, 'Reconnecting');
            wsRef.current = null;
        }

        wsRef.current = new WebSocket(`${settings.endpoints.rpcEndpoint}/websocket`);

        wsRef.current.onopen = () => {
            const payload = buildSubscribePayload(id, query);
            wsRef.current?.send(JSON.stringify(payload));

            // Reset reconnect attempts on successful connection
            reconnectAttemptsRef.current = 0;
            console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            // TODO: Parse the message and extract assets
            const data = JSON.parse(event.data);
            if (data) {
                //yes
            }
            // console.log('Received data:', data);
            // updateAssets(data.assets);
        };

        wsRef.current.onclose = (event) => {
            console.log('WebSocket disconnected', event.code, event.reason);


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
    }, [reconnect]);

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