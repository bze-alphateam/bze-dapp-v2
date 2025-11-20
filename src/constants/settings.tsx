import { AppSettings } from '@/types/settings'
import {getChainNativeAssetDenom} from "@/constants/assets";

// LocalStorage key for settings
export const SETTINGS_STORAGE_KEY = 'bze_app_settings'

// Default application settings
export const DEFAULT_SETTINGS: AppSettings = {
    endpoints: {
        restEndpoint: process.env.NEXT_PUBLIC_REST_ENDPOINT ?? '',
        rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? ''
    },
    preferredFeeDenom: getChainNativeAssetDenom()
}

// Validation error messages
export const VALIDATION_ERRORS = {
    EMPTY_ENDPOINT: 'Endpoint cannot be empty',
    INVALID_URL: 'Invalid URL format',
    INVALID_REST_PROTOCOL: 'REST endpoint must use HTTP or HTTPS protocol',
    INVALID_RPC_PROTOCOL: 'RPC endpoint must use WS or WSS protocol for WebSocket connection',
    CORS_ERROR: 'Endpoint validation failed - unable to connect or CORS not enabled',
    WEBSOCKET_ERROR: 'WebSocket connection failed - unable to connect to RPC endpoint',
    NETWORK_ERROR: 'Network error - unable to validate endpoint'
} as const

export const getAppName = () => process.env.NEXT_PUBLIC_APP_NAME ?? 'DEX'
