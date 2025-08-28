'use client'
import "@interchain-kit/react/styles.css"; // Import styles for the wallet modal
import { InterchainWalletModal, useWalletModal } from "@interchain-kit/react";
import {
    Badge,
    Box,
    Button,
    createListCollection,
    Drawer,
    HStack,
    IconButton,
    Image,
    Input,
    Portal,
    Select,
    Separator,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import {LuCopy, LuExternalLink, LuWallet, LuX} from 'react-icons/lu'
import {useMemo, useRef, useState} from 'react'
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {WalletState} from "@interchain-kit/core";
import {stringTruncateFromCenter} from "@/utils/strings";

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

// Main Wallet Sidebar Drawer Component
interface WalletSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export const WalletSidebar = ({ isOpen, onClose }: WalletSidebarProps) => {
    return (
        <Drawer.Root
            open={isOpen}
            onOpenChange={({ open }) => !open && onClose()}
            placement="end"
            size={{ base: 'full', md: 'md' }}
        >
            <Drawer.Backdrop />
            <Drawer.Positioner>
                <Drawer.Content>
                    {/* Fixed Header */}
                    <Drawer.Header borderBottomWidth="1px">
                        <HStack justify="space-between" w="full">
                            <HStack gap="2">
                                <LuWallet size="20" />
                                <Drawer.Title fontSize="lg" fontWeight="semibold">
                                    Wallet
                                </Drawer.Title>
                            </HStack>
                            <Drawer.CloseTrigger asChild>
                                <IconButton
                                    aria-label="Close wallet"
                                    size="sm"
                                    variant="ghost"
                                >
                                    <LuX size="16" />
                                </IconButton>
                            </Drawer.CloseTrigger>
                        </HStack>
                    </Drawer.Header>

                    {/* Scrollable Body */}
                    <Drawer.Body
                        p="0"
                        display="flex"
                        flexDirection="column"
                        minHeight="0"
                        height="100%"
                    >
                        <Box
                            flex="1"
                            overflowY="auto"
                            overflowX="hidden"
                            p="6"
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
                            <WalletSidebarContent />
                        </Box>
                    </Drawer.Body>
                </Drawer.Content>
            </Drawer.Positioner>
        </Drawer.Root>
    )
}

// Updated Wallet Sidebar Content Component (now fully scrollable)
export const WalletSidebarContent = () => {
    const {
        status,
        username,
        address,
        openView,
    } = useChain(getChainName());

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

    const { open } = useWalletModal();

    const walletAddress = stringTruncateFromCenter(address ?? "", 16)

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
        navigator.clipboard.writeText(address)
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

    const renderBalancesView = () => (
        <VStack gap="6" align="stretch">
            {/* Token Balances Section */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Balances
                </Text>
                <VStack gap="2" align="stretch">
                    {mockTokens.map((token, index) => (
                        <Box
                            key={index}
                            p="3"
                            bg="bg.subtle"
                            borderRadius="md"
                            borderWidth="1px"
                            _hover={{ bg: 'bg.muted' }}
                            cursor="pointer"
                            transition="background-color 0.2s"
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
                                    {token.isIBC && (
                                        <Badge size="xs" colorPalette="blue">
                                            IBC
                                        </Badge>
                                    )}
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

            {/* Quick Actions Section */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Quick Actions
                </Text>
                <VStack gap="2" align="stretch">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('send')}
                        w="full"
                    >
                        Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcSend')}
                        w="full"
                    >
                        IBC Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcDeposit')}
                        w="full"
                    >
                        IBC Deposit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        w="full"
                    >
                        <LuExternalLink />
                        View on Explorer
                    </Button>
                </VStack>
            </Box>

            {/* Disconnect Button */}
            <Box>
                <Button
                    size="sm"
                    width="full"
                    variant="outline"
                    colorPalette="red"
                    onClick={openView}
                >
                    Disconnect Wallet
                </Button>
            </Box>
        </VStack>
    )

    const renderSendForm = () => (
        <VStack gap="4" align="stretch">
            <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium">
                    Send Tokens
                </Text>
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCancel}
                >
                    <LuX size="14" />
                </Button>
            </HStack>

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
                    resize="none"
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
    )

    const renderIBCSendForm = () => (
        <VStack gap="4" align="stretch">
            <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium">
                    IBC Send
                </Text>
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCancel}
                >
                    <LuX size="14" />
                </Button>
            </HStack>

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
                    resize="none"
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
    )

    const renderIBCDepositForm = () => (
        <VStack gap="4" align="stretch">
            <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium">
                    IBC Deposit
                </Text>
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCancel}
                >
                    <LuX size="14" />
                </Button>
            </HStack>

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
    )

    const statusColor = useMemo(() => {
        switch (status) {
            case WalletState.Connected:
                return 'green'
            case WalletState.Connecting:
                return 'yellow'
            case WalletState.Disconnected:
                return 'red'
            default:
                return 'gray'
        }
    }, [status])

    return (
        <VStack gap="6" align="stretch">
            {/* Wallet Status - Always at top */}
            <Box>
                <InterchainWalletModal />
                <HStack justify="space-between" mb="3">
                    <Text fontSize="sm" fontWeight="medium">
                        Wallet Status
                    </Text>
                    <Badge colorPalette={statusColor} size="sm">
                        {status}
                    </Badge>
                </HStack>
                {status === WalletState.Connected &&
                    <Box
                        p="3"
                        bg="bg.subtle"
                        borderRadius="md"
                        borderWidth="1px"
                    >
                        <Text fontSize="xs" color="fg.muted" mb="1">
                            {username ?? "Address"}
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
                                        bg="green"
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
                }
                {status !== WalletState.Connected &&
                    <Button
                        size="sm"
                        variant="solid"
                        w="full"
                        onClick={open}
                    >
                        Connect Wallet
                    </Button>
                }
            </Box>

            <Separator />

            {/* Dynamic Content Based on View State */}
            {status === WalletState.Connected && viewState === 'balances' && renderBalancesView()}
            {status === WalletState.Connected && viewState === 'send' && renderSendForm()}
            {status === WalletState.Connected && viewState === 'ibcSend' && renderIBCSendForm()}
            {status === WalletState.Connected && viewState === 'ibcDeposit' && renderIBCDepositForm()}
        </VStack>
    )
}