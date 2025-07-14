'use client'

import {
    VStack,
    HStack,
    Text,
    Button,
    Box,
    Separator,
    Badge,
    Input,
    Textarea,
    Select,
    Image,
    createListCollection,
    Portal
} from '@chakra-ui/react'
import { LuCopy, LuExternalLink } from 'react-icons/lu'
import { useState, useRef } from 'react'

// Mock token data - replace with real data from your wallet/API
const mockTokens = [
    {
        symbol: 'BZE',
        name: 'BeeZee',
        balance: '1,234.56',
        value: '$2,469.12',
        logo: '/images/bze_alternative_512x512.png',
        isIBC: false,
        originalChain: 'BeeZee'
    },
    {
        symbol: 'ATOM',
        name: 'Cosmos',
        balance: '89.12',
        value: '$534.72',
        logo: '/images/bze_alternative_512x512.png', // Placeholder
        isIBC: true,
        originalChain: 'Cosmos Hub'
    },
    {
        symbol: 'OSMO',
        name: 'Osmosis',
        balance: '456.78',
        value: '$182.71',
        logo: '/images/bze_alternative_512x512.png', // Placeholder
        isIBC: true,
        originalChain: 'Osmosis'
    },
    {
        symbol: 'JUNO',
        name: 'Juno',
        balance: '23.45',
        value: '$93.80',
        logo: '/images/bze_alternative_512x512.png', // Placeholder
        isIBC: true,
        originalChain: 'Juno'
    },
    {
        symbol: 'SCRT',
        name: 'Secret',
        balance: '67.89',
        value: '$203.67',
        logo: '/images/bze_alternative_512x512.png', // Placeholder
        isIBC: true,
        originalChain: 'Secret Network'
    },

]

// Mock IBC chains
const mockIBCChains = [
    { label: 'Cosmos Hub', value: 'cosmoshub-4' },
    { label: 'Osmosis', value: 'osmosis-1' },
    { label: 'Juno', value: 'juno-1' },
    { label: 'Secret Network', value: 'secret-4' },
]

type ViewState = 'balances' | 'send' | 'ibcSend' | 'ibcDeposit'

export const WalletSidebarContent = () => {
    const [viewState, setViewState] = useState<ViewState>('balances')
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
    const copyButtonRef = useRef<HTMLButtonElement>(null)

    // Send form state
    const [selectedToken, setSelectedToken] = useState('')
    const [sendAmount, setSendAmount] = useState('')
    const [recipient, setRecipient] = useState('')
    const [memo, setMemo] = useState('')

    // IBC Send form state
    const [ibcToken, setIbcToken] = useState('')
    const [ibcChain, setIbcChain] = useState('')
    const [ibcAmount, setIbcAmount] = useState('')
    const [ibcRecipient, setIbcRecipient] = useState('')
    const [ibcMemo, setIbcMemo] = useState('')

    // IBC Deposit form state
    const [depositChain, setDepositChain] = useState('')
    const [depositToken, setDepositToken] = useState('')
    const [depositAmount, setDepositAmount] = useState('')

    const walletAddress = "bze1abc...xyz789"

    // Create collections for selects
    const tokenCollection = createListCollection({
        items: mockTokens.map(token => ({
            label: `${token.symbol} - ${token.name}`,
            value: token.symbol,
            logo: token.logo
        }))
    })

    const ibcTokenCollection = createListCollection({
        items: mockTokens.filter(token => token.isIBC).map(token => ({
            label: `${token.symbol} - ${token.name}`,
            value: token.symbol,
            logo: token.logo
        }))
    })

    const chainCollection = createListCollection({
        items: mockIBCChains
    })

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(walletAddress)
        setShowCopiedTooltip(true)
        setTimeout(() => setShowCopiedTooltip(false), 2000)
    }

    const handleSend = () => {
        console.log('Sending:', { selectedToken, sendAmount, recipient, memo })
        // Handle send logic
        setViewState('balances')
        // Reset form
        resetSendForm()
    }

    const handleIBCSend = () => {
        console.log('IBC Sending:', { ibcToken, ibcChain, ibcAmount, ibcRecipient, ibcMemo })
        // Handle IBC send logic
        setViewState('balances')
        // Reset form
        resetIBCSendForm()
    }

    const handleIBCDeposit = () => {
        console.log('IBC Deposit:', { depositChain, depositToken, depositAmount })
        // Handle IBC deposit logic
        setViewState('balances')
        // Reset form
        resetIBCDepositForm()
    }

    const resetSendForm = () => {
        setSelectedToken('')
        setSendAmount('')
        setRecipient('')
        setMemo('')
    }

    const resetIBCSendForm = () => {
        setIbcToken('')
        setIbcChain('')
        setIbcAmount('')
        setIbcRecipient('')
        setIbcMemo('')
    }

    const resetIBCDepositForm = () => {
        setDepositChain('')
        setDepositToken('')
        setDepositAmount('')
    }

    const handleCancel = () => {
        // Reset all forms when canceling
        resetSendForm()
        resetIBCSendForm()
        resetIBCDepositForm()
        setViewState('balances')
    }

    const handleDisconnect = () => {
        console.log('Wallet disconnected')
    }

    const renderBalancesView = () => (
        <>
            {/* Token Balances */}
            <Box flex="1" minHeight="0">
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Balances
                </Text>
                <Box
                    overflowY="auto"
                    maxHeight="100%"
                    css={{
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'var(--chakra-colors-bg-subtle)',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'var(--chakra-colors-border-subtle)',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: 'var(--chakra-colors-border)',
                        },
                    }}
                >
                    <VStack gap="2" align="stretch">
                        {mockTokens.map((token, index) => (
                            <Box
                                key={index}
                                p="3"
                                bg="bg.subtle"
                                borderRadius="md"
                                borderWidth="1px"
                            >
                                <HStack justify="space-between" mb="1">
                                    <HStack gap="2">
                                        <Image
                                            src={token.logo}
                                            alt={token.symbol}
                                            width="20px"
                                            height="20px"
                                            borderRadius="full"
                                        />
                                        <Text fontSize="sm" fontWeight="medium">
                                            {token.symbol}
                                        </Text>
                                        <Text fontSize="xs" color="fg.muted">
                                            {token.name}
                                        </Text>
                                    </HStack>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text fontSize="sm" fontFamily="mono">
                                        {token.balance}
                                    </Text>
                                    <Text fontSize="sm" color="fg.muted">
                                        {token.value}
                                    </Text>
                                </HStack>
                            </Box>
                        ))}
                    </VStack>
                </Box>
            </Box>

            {/* Quick Actions */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Quick Actions
                </Text>
                <VStack gap="2" align="stretch">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('send')}
                    >
                        Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcSend')}
                    >
                        IBC Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcDeposit')}
                    >
                        IBC Deposit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                    >
                        <LuExternalLink />
                        View on Explorer
                    </Button>
                </VStack>
            </Box>
        </>
    )

    const renderSendForm = () => (
        <Box flex="1" minHeight="0">
            <Text fontSize="sm" fontWeight="medium" mb="4">
                Send Tokens
            </Text>

            <VStack gap="4" align="stretch">
                <Box>
                    <Text fontSize="sm" mb="2">Token</Text>
                    <Select.Root
                        collection={tokenCollection}
                        size="sm"
                        value={selectedToken ? [selectedToken] : []}
                        onValueChange={(details) => setSelectedToken(details.value[0] || '')}
                    >
                        <Select.HiddenSelect />
                        <Select.Control>
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select token" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {tokenCollection.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                            <HStack gap="2">
                                                <Image
                                                    src={item.logo}
                                                    alt={item.value}
                                                    width="16px"
                                                    height="16px"
                                                    borderRadius="full"
                                                />
                                                <Text>{item.label}</Text>
                                            </HStack>
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Amount</Text>
                    <Input
                        size="sm"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Recipient Address</Text>
                    <Input
                        size="sm"
                        placeholder="bze1..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Memo (Optional)</Text>
                    <Textarea
                        size="sm"
                        placeholder="Transaction memo"
                        rows={3}
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </Box>

                <HStack gap="2">
                    <Button
                        size="sm"
                        flex="1"
                        onClick={handleSend}
                        colorPalette="blue"
                    >
                        Sign
                    </Button>
                    <Button
                        size="sm"
                        flex="1"
                        variant="outline"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </HStack>
            </VStack>
        </Box>
    )

    const renderIBCSendForm = () => (
        <Box flex="1" minHeight="0">
            <Text fontSize="sm" fontWeight="medium" mb="4">
                IBC Send
            </Text>

            <VStack gap="4" align="stretch">
                <Box>
                    <Text fontSize="sm" mb="2">IBC Token</Text>
                    <Select.Root
                        collection={ibcTokenCollection}
                        size="sm"
                        value={ibcToken ? [ibcToken] : []}
                        onValueChange={(details) => setIbcToken(details.value[0] || '')}
                    >
                        <Select.HiddenSelect />
                        <Select.Control>
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select IBC token" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {ibcTokenCollection.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                            <HStack gap="2">
                                                <Image
                                                    src={item.logo}
                                                    alt={item.value}
                                                    width="16px"
                                                    height="16px"
                                                    borderRadius="full"
                                                />
                                                <Text>{item.label}</Text>
                                            </HStack>
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Destination Chain</Text>
                    <Select.Root
                        collection={chainCollection}
                        size="sm"
                        value={ibcChain ? [ibcChain] : []}
                        onValueChange={(details) => setIbcChain(details.value[0] || '')}
                    >
                        <Select.HiddenSelect />
                        <Select.Control>
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select chain" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {chainCollection.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                            {item.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Amount</Text>
                    <Input
                        size="sm"
                        placeholder="0.00"
                        value={ibcAmount}
                        onChange={(e) => setIbcAmount(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Recipient Address</Text>
                    <Input
                        size="sm"
                        placeholder="cosmos1..."
                        value={ibcRecipient}
                        onChange={(e) => setIbcRecipient(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Memo (Optional)</Text>
                    <Textarea
                        size="sm"
                        placeholder="Transaction memo"
                        rows={3}
                        value={ibcMemo}
                        onChange={(e) => setIbcMemo(e.target.value)}
                    />
                </Box>

                <HStack gap="2">
                    <Button
                        size="sm"
                        flex="1"
                        onClick={handleIBCSend}
                        colorPalette="blue"
                    >
                        Sign
                    </Button>
                    <Button
                        size="sm"
                        flex="1"
                        variant="outline"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </HStack>
            </VStack>
        </Box>
    )

    const renderIBCDepositForm = () => (
        <Box flex="1" minHeight="0">
            <Text fontSize="sm" fontWeight="medium" mb="4">
                IBC Deposit
            </Text>

            <VStack gap="4" align="stretch">
                <Box>
                    <Text fontSize="sm" mb="2">Source Chain</Text>
                    <Select.Root
                        collection={chainCollection}
                        size="sm"
                        value={depositChain ? [depositChain] : []}
                        onValueChange={(details) => setDepositChain(details.value[0] || '')}
                    >
                        <Select.HiddenSelect />
                        <Select.Control>
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select source chain" />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                                <Select.Indicator />
                            </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                            <Select.Positioner>
                                <Select.Content>
                                    {chainCollection.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                            {item.label}
                                            <Select.ItemIndicator />
                                        </Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                    </Select.Root>
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Token</Text>
                    <Input
                        size="sm"
                        placeholder="ATOM, OSMO, etc."
                        value={depositToken}
                        onChange={(e) => setDepositToken(e.target.value)}
                    />
                </Box>

                <Box>
                    <Text fontSize="sm" mb="2">Amount</Text>
                    <Input
                        size="sm"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                    />
                </Box>

                <Box
                    p="3"
                    bg="bg.subtle"
                    borderRadius="md"
                    borderWidth="1px"
                >
                    <Text fontSize="xs" color="fg.muted" mb="1">
                        Deposit Address
                    </Text>
                    <Text fontSize="sm" fontFamily="mono">
                        {walletAddress}
                    </Text>
                </Box>

                <HStack gap="2">
                    <Button
                        size="sm"
                        flex="1"
                        onClick={handleIBCDeposit}
                        colorPalette="blue"
                    >
                        Generate Deposit
                    </Button>
                    <Button
                        size="sm"
                        flex="1"
                        variant="outline"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </HStack>
            </VStack>
        </Box>
    )

    return (
        <VStack gap="6" align="stretch" height="100%">
            {/* Wallet Status */}
            <Box>
                <HStack justify="space-between" mb="3">
                    <Text fontSize="sm" fontWeight="medium">
                        Wallet Status
                    </Text>
                    <Badge colorPalette="green" size="sm">
                        Connected
                    </Badge>
                </HStack>

                <Box
                    p="3"
                    bg="bg.subtle"
                    borderRadius="md"
                    borderWidth="1px"
                >
                    <Text fontSize="xs" color="fg.muted" mb="1">
                        Address
                    </Text>
                    <HStack justify="space-between">
                        <Text fontSize="sm" fontFamily="mono">
                            {walletAddress}
                        </Text>
                        <Box position="relative">
                            <Button
                                ref={copyButtonRef}
                                size="xs"
                                variant="ghost"
                                onClick={handleCopyAddress}
                            >
                                <LuCopy />
                            </Button>
                            {showCopiedTooltip && (
                                <Box
                                    position="absolute"
                                    top="-35px"
                                    right="0"
                                    bg="green.500"
                                    color="white"
                                    px="2"
                                    py="1"
                                    borderRadius="md"
                                    fontSize="xs"
                                    whiteSpace="nowrap"
                                    zIndex="tooltip"
                                >
                                    Copied!
                                </Box>
                            )}
                        </Box>
                    </HStack>
                </Box>
            </Box>

            <Separator />

            {/* Dynamic Content Based on View State */}
            {viewState === 'balances' && renderBalancesView()}
            {viewState === 'send' && renderSendForm()}
            {viewState === 'ibcSend' && renderIBCSendForm()}
            {viewState === 'ibcDeposit' && renderIBCDepositForm()}

            {/* Disconnect Button - Always at bottom */}
            {viewState === 'balances' && (
                <Box>
                    <Button
                        size="sm"
                        width="full"
                        variant="outline"
                        colorPalette="red"
                        onClick={handleDisconnect}
                    >
                        Disconnect Wallet
                    </Button>
                </Box>
            )}
        </VStack>
    )
}