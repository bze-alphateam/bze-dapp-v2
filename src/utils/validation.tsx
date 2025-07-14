import { ValidationResult } from '../types/settings'
import { VALIDATION_ERRORS } from '../constants/settings'

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

    // Mock validation - replace with actual API call
    try {
        // In production: make a test request to validate CORS and connectivity
        // const response = await fetch(`${endpoint}/status`, { method: 'GET' })
        // return { isValid: response.ok }

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

// Validate RPC endpoint
export async function validateRpcEndpoint(endpoint: string): Promise<ValidationResult> {
    // Basic validation
    if (!endpoint.trim()) {
        return { isValid: false, error: VALIDATION_ERRORS.EMPTY_ENDPOINT }
    }

    if (!isValidUrl(endpoint)) {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_URL }
    }

    const url = new URL(endpoint)
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
        return { isValid: false, error: VALIDATION_ERRORS.INVALID_RPC_PROTOCOL }
    }

    // Mock validation - replace with actual WebSocket connection test
    try {
        // In production: attempt WebSocket connection
        // const ws = new WebSocket(endpoint)
        // return new Promise((resolve) => {
        //   ws.onopen = () => resolve({ isValid: true })
        //   ws.onerror = () => resolve({ isValid: false, error: VALIDATION_ERRORS.WEBSOCKET_ERROR })
        // })

        return {
            isValid: false,
            error: VALIDATION_ERRORS.WEBSOCKET_ERROR
        }
    } catch (error) {
        console.error(error)

        return {
            isValid: false,
            error: VALIDATION_ERRORS.NETWORK_ERROR
        }
    }
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