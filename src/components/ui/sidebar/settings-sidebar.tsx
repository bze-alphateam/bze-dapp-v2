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
    Badge,
} from '@chakra-ui/react'
import { useTheme } from "next-themes"
import {useState, useEffect, useMemo, useCallback} from 'react'
import { useSettings } from '@/hooks/useSettings'
import {convertToWebSocketUrl, validateEndpoints} from '@/utils/validation'
import {
    CONNECTION_TYPE_NONE,
    CONNECTION_TYPE_POLLING,
    CONNECTION_TYPE_WS,
    EndpointValidationResults
} from '@/types/settings'
import {useToast} from "@/hooks/useToast";
import {useConnectionType} from "@/hooks/useConnectionType";

// Your existing content component - unchanged except for removing height="100%"
export const SettingsSidebarContent = () => {
    const { setTheme, resolvedTheme} = useTheme()
    const {toast} = useToast()
    const { settings, isLoaded, updateEndpoints, defaultSettings } = useSettings()
    const {connectionType} = useConnectionType()

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

    const handleValidateEndpoints = useCallback(async (rest: string, rpc: string) => {
        setIsValidating(true)
        setValidationResults({})

        try {
            const results = await validateEndpoints(rest, rpc)
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
    }, [])

    const handleSaveEndpoints = useCallback(async (rest: string, rpc: string) => {
        setValidationResults({})
        const results = await validateEndpoints(rest, rpc)
        if (!results.isValid) {
            setValidationResults({
                rest: results.rest,
                rpc: results.rpc
            })

            setTimeout(() => setValidationResults({}), 10_000)

            return
        }

        const success = updateEndpoints({
            restEndpoint: rest.trim(),
            rpcEndpoint: convertToWebSocketUrl(rpc.trim())
        })

        if (success) {
            toast.success('Success!', 'Settings have been saved.')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleResetToDefaults = useCallback(() => {
        setRestEndpoint(defaultSettings.endpoints.restEndpoint)
        setRpcEndpoint(defaultSettings.endpoints.rpcEndpoint)
        setValidationResults({})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const connectionStatusText = useMemo(() => {
        switch(connectionType) {
            case CONNECTION_TYPE_NONE:
                return 'Failed'
            case CONNECTION_TYPE_POLLING:
                return 'Polling'
            case CONNECTION_TYPE_WS:
                return 'Connected'
        }
    }, [connectionType])

    const connectionStatusBadgeColor = useMemo(() => {
        switch(connectionType) {
            case CONNECTION_TYPE_NONE:
                return 'red'
            case CONNECTION_TYPE_POLLING:
                return 'orange'
            case CONNECTION_TYPE_WS:
                return 'green'
        }
    }, [connectionType])

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
                            checked={resolvedTheme === 'dark'}
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
                    <Box>
                        <HStack gap="2" align="center" justify="space-between">
                            <Text fontSize="sm" mb="1">Status: </Text>
                            <Badge colorPalette={connectionStatusBadgeColor}>{connectionStatusText}</Badge>
                        </HStack>
                    </Box>
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
                            <Box
                                mt="2"
                                p="3"
                                bgGradient="to-br"
                                gradientFrom={validationResults.rest.isValid ? "green.500/15" : "red.500/15"}
                                gradientTo={validationResults.rest.isValid ? "green.600/15" : "red.600/15"}
                                borderWidth="1px"
                                borderColor={validationResults.rest.isValid ? "green.500/30" : "red.500/30"}
                                borderRadius="md"
                            >
                                <Text fontSize="sm" color={validationResults.rest.isValid ? "green.700" : "red.700"} _dark={{color: validationResults.rest.isValid ? "green.300" : "red.300"}}>
                                    {validationResults.rest.error || 'REST endpoint is valid'}
                                </Text>
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
                            <Box
                                mt="2"
                                p="3"
                                bgGradient="to-br"
                                gradientFrom={validationResults.rpc.isValid ? "green.500/15" : "red.500/15"}
                                gradientTo={validationResults.rpc.isValid ? "green.600/15" : "red.600/15"}
                                borderWidth="1px"
                                borderColor={validationResults.rpc.isValid ? "green.500/30" : "red.500/30"}
                                borderRadius="md"
                            >
                                <Text fontSize="sm" color={validationResults.rpc.isValid ? "green.700" : "red.700"} _dark={{color: validationResults.rpc.isValid ? "green.300" : "red.300"}}>
                                    {validationResults.rpc.error || 'RPC endpoint is valid'}
                                </Text>
                            </Box>
                        )}
                    </Box>

                    {/* Validation Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleValidateEndpoints(restEndpoint, rpcEndpoint)}
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
                        onClick={() => handleSaveEndpoints(restEndpoint, rpcEndpoint)}
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