'use client'

import {
    VStack,
    HStack,
    Text,
    Switch,
    Button,
    Separator,
    Box,
    Input,
    Alert,
} from '@chakra-ui/react'
import { useTheme } from "next-themes"
import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import {convertToWebSocketUrl, validateEndpoints} from '@/utils/validation'
import { EndpointValidationResults } from '@/types/settings'
import {useToast} from "@/hooks/useToast";

// Your existing content component - unchanged except for removing height="100%"
export const SettingsSidebarContent = () => {
    const { theme, setTheme } = useTheme()
    const {toast} = useToast()
    const { settings, isLoaded, updateEndpoints, defaultSettings } = useSettings()

    // Local form state
    const [restEndpoint, setRestEndpoint] = useState('')
    const [rpcEndpoint, setRpcEndpoint] = useState('')
    const [isValidating, setIsValidating] = useState(false)
    const [validationResults, setValidationResults] = useState<EndpointValidationResults>({})

    // Initialize form with loaded settings
    useEffect(() => {
        if (isLoaded) {
            setRestEndpoint(settings.endpoints.restEndpoint)
            setRpcEndpoint(settings.endpoints.rpcEndpoint)
        }
    }, [isLoaded, settings])

    const handleValidateEndpoints = async () => {
        setIsValidating(true)
        setValidationResults({})

        try {
            const results = await validateEndpoints(restEndpoint, rpcEndpoint)
            setValidationResults({
                rest: results.rest,
                rpc: results.rpc
            })
        } catch (error) {
            console.error(error)
            setValidationResults({
                rest: { isValid: false, error: 'Validation failed' },
                rpc: { isValid: false, error: 'Validation failed' }
            })
        } finally {
            setIsValidating(false)
            setTimeout(() => setValidationResults({}), 10_000)
        }
    }

    const handleSaveEndpoints = async () => {
        setValidationResults({})
        const results = await validateEndpoints(restEndpoint, rpcEndpoint)
        if (!results.isValid) {
            setValidationResults({
                rest: results.rest,
                rpc: results.rpc
            })

            setTimeout(() => setValidationResults({}), 10_000)

            return
        }

        const success = updateEndpoints({
            restEndpoint: restEndpoint.trim(),
            rpcEndpoint: convertToWebSocketUrl(rpcEndpoint.trim())
        })

        if (success) {
            toast.success('Success!', 'Settings have been saved.')
        }
    }

    const handleResetToDefaults = () => {
        setRestEndpoint(defaultSettings.endpoints.restEndpoint)
        setRpcEndpoint(defaultSettings.endpoints.rpcEndpoint)
        setValidationResults({})
    }

    const hasUnsavedChanges =
        restEndpoint !== settings.endpoints.restEndpoint ||
        rpcEndpoint !== settings.endpoints.rpcEndpoint

    return (
        <VStack gap="6" align="stretch">
            {/* Appearance Section */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Appearance
                </Text>
                <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="sm">Dark Mode</Text>
                        <Switch.Root
                            checked={theme === 'dark'}
                            onCheckedChange={(details) => {
                                const newTheme = details.checked ? 'dark' : 'light'
                                setTheme(newTheme)
                            }}
                        >
                            <Switch.HiddenInput />
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Root>
                    </HStack>
                </VStack>
            </Box>

            <Separator />

            {/* BeeZee Endpoints Section */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    BeeZee Endpoints
                </Text>

                <VStack gap="4" align="stretch">
                    {/* REST Endpoint */}
                    <Box>
                        <Text fontSize="sm" mb="1">REST Endpoint</Text>
                        <Text fontSize="xs" color="fg.muted" mb="2">
                            Note: Endpoint must have CORS enabled to work in browser
                        </Text>
                        <Input
                            size="sm"
                            placeholder="https://rest.getbze.com"
                            value={restEndpoint}
                            onChange={(e) => setRestEndpoint(e.target.value)}
                        />
                        {validationResults.rest && (
                            <Box mt="2">
                                <Alert.Root
                                    status={validationResults.rest.isValid ? "success" : "error"}
                                    size="sm"
                                >
                                    <Alert.Indicator />
                                    <Alert.Description>
                                        {validationResults.rest.error || 'REST endpoint is valid'}
                                    </Alert.Description>
                                </Alert.Root>
                            </Box>
                        )}
                    </Box>

                    {/* RPC Endpoint */}
                    <Box>
                        <Text fontSize="sm" mb="1">RPC Endpoint</Text>
                        <Text fontSize="xs" color="fg.muted" mb="2">
                            Note: Must support WebSocket (WS/WSS) connections
                        </Text>
                        <Input
                            size="sm"
                            placeholder="wss://rpc.getbze.com"
                            value={rpcEndpoint}
                            onChange={(e) => setRpcEndpoint(e.target.value)}
                        />
                        {validationResults.rpc && (
                            <Box mt="2">
                                <Alert.Root
                                    status={validationResults.rpc.isValid ? "success" : "error"}
                                    size="sm"
                                >
                                    <Alert.Indicator />
                                    <Alert.Description>
                                        {validationResults.rpc.error || 'RPC endpoint is valid'}
                                    </Alert.Description>
                                </Alert.Root>
                            </Box>
                        )}
                    </Box>

                    {/* Validation Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleValidateEndpoints}
                        loading={isValidating}
                        disabled={!restEndpoint.trim() || !rpcEndpoint.trim()}
                    >
                        {isValidating ? 'Validating...' : 'Validate Endpoints'}
                    </Button>
                </VStack>
            </Box>

            {/* Action Buttons */}
            <Box>
                <VStack gap="3">
                    <Button
                        size="sm"
                        width="full"
                        onClick={handleSaveEndpoints}
                        colorPalette="blue"
                        disabled={!hasUnsavedChanges}
                    >
                        Save Settings
                    </Button>
                    <Button
                        size="sm"
                        width="full"
                        variant="outline"
                        onClick={handleResetToDefaults}
                    >
                        Reset to Defaults
                    </Button>
                </VStack>
            </Box>
        </VStack>
    )
}