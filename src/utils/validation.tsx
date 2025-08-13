import { ValidationResult } from '@/types/settings'
import { VALIDATION_ERRORS } from '@/constants/settings'
import {getBurnerParamsWithClient} from "@/query/burner";
import {createRestClient} from "@/query/client";

// URL validation helper
function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString)
        return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'ws:' || url.protocol === 'wss:'
    } catch {
        return false
    }
}

// Validate REST endpoint
export async function validateRestEndpoint(endpoint: string): Promise<ValidationResult> {
    // Basic validation
    if (!endpoint.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.EMPTY_ENDPOINT }
    }

    if (!isValidUrl(endpoint)) {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_URL }
    }

    const url = new URL(endpoint)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_REST_PROTOCOL }
    }

    try {
        //make a params call to check the endpoint
        const client = await createRestClient(endpoint)
        const params = await getBurnerParamsWithClient(client)
        if (params) {
            return {
                isValid: true,
            }
        }

        return {
            isValid: false,
            error: VALIDATION_ERRORS.CORS_ERROR
        }
    } catch (error) {
        console.error(error)

        return {
            isValid: false,
            error: VALIDATION_ERRORS.NETWORK_ERROR
        }
    }
}

// Enhanced validation function with auto-conversion
export async function validateRpcEndpoint(endpoint: string): Promise<ValidationResult> {
    if (!endpoint.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.EMPTY_ENDPOINT }
    }

    if (!isValidUrl(endpoint)) {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_URL }
    }

    // Convert HTTP/HTTPS to WebSocket if needed
    const wsEndpoint = convertToWebSocketUrl(endpoint);
    const url = new URL(wsEndpoint);

    // Now validate WebSocket protocol
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_RPC_PROTOCOL }
    }

    // Test actual WebSocket connection
    try {
        const isConnectable = await testWebSocketConnection(wsEndpoint);

        if (isConnectable) {
            return {
                isValid: true,
            };
        } else {
            return {
                isValid: false,
                error: VALIDATION_ERRORS.WEBSOCKET_ERROR
            };
        }
    } catch (error) {
        console.error('WebSocket validation error:', error);
        return {
            isValid: false,
            error: VALIDATION_ERRORS.NETWORK_ERROR
        };
    }
}

// Test WebSocket connection
function testWebSocketConnection(endpoint: string): Promise<boolean> {
    return new Promise((resolve) => {
        const ws = new WebSocket(`${endpoint}/websocket`);
        const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
        }, 5000); // 5 second timeout

        ws.onopen = () => {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
        };

        ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        ws.onclose = (event) => {
            clearTimeout(timeout);
            // If it closes immediately after opening, consider it valid
            if (event.wasClean) {
                resolve(true);
            }
        };
    });
}

// Validate both endpoints concurrently
export async function validateEndpoints(restEndpoint: string, rpcEndpoint: string) {
    const [restResult, rpcResult] = await Promise.all([
        validateRestEndpoint(restEndpoint),
        validateRpcEndpoint(rpcEndpoint)
    ])

    return {
        rest: restResult,
        rpc: rpcResult,
        isValid: restResult.isValid && rpcResult.isValid
    }
}

// Convert HTTP/HTTPS URLs to WebSocket URLs
export function convertToWebSocketUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);

        // Convert protocols
        if (parsedUrl.protocol === 'http:') {
            parsedUrl.protocol = 'ws:';
        } else if (parsedUrl.protocol === 'https:') {
            parsedUrl.protocol = 'wss:';
        }

        return parsedUrl.toString();
    } catch (error) {
        // If URL parsing fails, return original string
        console.warn('Failed to parse URL for WebSocket conversion:', error);

        return url;
    }
}
