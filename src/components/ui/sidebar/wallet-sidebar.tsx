'use client'
import "@interchain-kit/react/styles.css"; // Import styles for the wallet modal
import { InterchainWalletModal, useWalletModal } from "@interchain-kit/react";
import {
    Badge,
    Box,
    Button,
    createListCollection, Field, Group,
    HStack,
    Image,
    Input,
    Portal,
    Select,
    Separator, Skeleton,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import {LuCopy, LuExternalLink, LuX} from 'react-icons/lu'
import {useMemo, useRef, useState} from 'react'
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {WalletState} from "@interchain-kit/core";
import {stringTruncateFromCenter} from "@/utils/strings";
import {AssetBalance, useBalances} from "@/hooks/useBalances";
import {useAsset} from "@/hooks/useAssets";
import {isIbcDenom} from "@/utils/denom";
import {Balance} from "@/types/balance";
import {prettyAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {useAssetPrice} from "@/hooks/usePrices";
import {getChainNativeAssetDenom} from "@/constants/assets";
import {sanitizeNumberInput} from "@/utils/number";
import {validateBZEBech32Address} from "@/utils/address";
import BigNumber from "bignumber.js";

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

interface BalanceItemProps {
    balance: Balance;
}

const BalanceItem = ({balance}: BalanceItemProps) => {
    const { asset, isLoading} = useAsset(balance.denom);
    const { price, isLoading: pricesLoading} = useAssetPrice(balance.denom);

    const formattedBalanceAmount = useMemo(() => {
        return prettyAmount(uAmountToBigNumberAmount(balance.amount, asset?.decimals ?? 0))
    }, [balance.amount, asset])

    const formattedBalanceUSDValue = useMemo(() => {
        if (!price) return '0.00';
        if (!asset) return '0.00';

        const value = price.multipliedBy(uAmountToBigNumberAmount(balance.amount, asset.decimals))

        return prettyAmount(value)
    }, [price, asset, balance.amount])

    if (!asset) return null;

    return (
        <Box
            p="3"
            bg="bg.subtle"
            borderRadius="md"
            borderWidth="1px"
            _hover={{ bg: 'bg.muted' }}
            cursor="pointer"
            transition="background-color 0.2s"
        >
            <HStack justify="space-between" mb="1">
                <Skeleton asChild loading={isLoading}>
                    <HStack gap="2">
                        <Image
                            src={asset.logo}
                            alt={asset.ticker}
                            width="20px"
                            height="20px"
                            borderRadius="full"
                        />
                        <Text fontSize="sm" fontWeight="medium">
                            {asset.ticker}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                            {asset.name}
                        </Text>
                        {isIbcDenom(asset.denom) && (
                            <Badge size="xs" colorPalette="blue">
                                IBC
                            </Badge>
                        )}
                    </HStack>
                </Skeleton>
            </HStack>
            <HStack justify="space-between">
                <Skeleton asChild loading={isLoading}>
                    <Text fontSize="sm" fontFamily="mono">
                        {formattedBalanceAmount}
                    </Text>
                </Skeleton>
                <Skeleton asChild loading={pricesLoading}>
                    <Text fontSize="sm" color="fg.muted">
                        ${formattedBalanceUSDValue}
                    </Text>
                </Skeleton>
            </HStack>
        </Box>
    )
}

const SendForm = ({balances, onClose}: {balances: AssetBalance[], onClose: () => void}) => {
    // Send form state
    const [selectedCoin, setSelectedCoin] = useState<AssetBalance|undefined>()

    const [sendAmount, setSendAmount] = useState('')
    const [sendAmountError, setSendAmountError] = useState('')

    const [recipient, setRecipient] = useState('')
    const [recipientError, setRecipientError] = useState('')

    const [memo, setMemo] = useState('')
    const [memoError, setMemoError] = useState('')

    // Create collections for selects
    const coinsCollection = createListCollection({
        items: balances.map(item => ({
            label: `${item.ticker} - ${uAmountToBigNumberAmount(item.amount, item?.decimals ?? 0)}`,
            value: item.ticker,
            logo: item.logo
        }))
    })

    const handleSend = () => {
        console.log('Sending:', { selectedCoin, sendAmount, recipient, memo })
        // Reset form
        resetSendForm()
    }
    const handleCancel = () => {
        // Reset all forms when canceling
        resetSendForm()
        onClose()
    }

    const onRecipientChange = (recipient: string) => {
        setRecipient(recipient)
        if (recipient.length === 0) {
            setRecipientError('')
            return
        }

        const validate = validateBZEBech32Address(recipient)
        if (validate.isValid) {
            setRecipientError('')
        } else {
            setRecipientError(validate.message)
        }
    }

    const onAmountChange = (amount: string) => {
        setSendAmount(sanitizeNumberInput(amount))
        setSendAmountError('')
    }

    const validateAmount = (amount: string, coin: AssetBalance|undefined) => {
        if (!coin) return
        if (amount === "") return

        const amountNumber = BigNumber(amount)
        if (amountNumber.isNaN()) {
            setSendAmountError('Invalid amount')
            return
        }

        const coinBalance = uAmountToBigNumberAmount(coin.amount, coin.decimals)
        if (coinBalance.isLessThan(amount)) {
            setSendAmountError('Insufficient balance')
        } else {
            setSendAmountError('')
        }
    }

    const onCoinSelectChange = (ticker: string) => {
        if (ticker === "") return

        const selectedCoin = balances.find(item => item.ticker === ticker)
        if (selectedCoin) {
            setSelectedCoin(selectedCoin)
            validateAmount(sendAmount, selectedCoin)
        }
    }

    const setMaxAmount = () => {
        if (!selectedCoin) return
        const maxAmount = uAmountToBigNumberAmount(selectedCoin.amount, selectedCoin.decimals)
        onAmountChange(maxAmount.toString())
        validateAmount(maxAmount.toString(), selectedCoin)
    }

    const onMemoChange = (memo: string) => {
        setMemo(memo)
        if (memo.length > 256) {
            console.log('Memo is too long')
            setMemoError('Memo must be less than or equal to 256 characters')
        } else {
            console.log('Memo is valid')
            setMemoError('')
        }
    }

    const resetSendForm = () => {
        setSelectedCoin(undefined)
        setSendAmount('')
        setRecipient('')
        setMemo('')
    }

    return (
        <VStack gap="4" align="stretch">
            <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium">
                    Send Coins
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
                <Select.Root
                    collection={coinsCollection}
                    size="sm"
                    value={selectedCoin?.ticker ? [selectedCoin.ticker] : []}
                    onValueChange={(details) => onCoinSelectChange(details.value[0] || '')}
                >
                    <Select.Label>Coin</Select.Label>
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
                                {coinsCollection.items.map((item) => (
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
                <Field.Root invalid={sendAmountError !== ""}>
                    <Field.Label>Amount</Field.Label>
                    <Group attached w="full" maxW="sm">
                        <Input
                            size="sm"
                            placeholder="Amount to send"
                            value={sendAmount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            onBlur={() => validateAmount(sendAmount, selectedCoin)}
                        />
                        <Button variant="outline" size="sm" onClick={setMaxAmount}>
                            Max
                        </Button>
                    </Group>
                    <Field.ErrorText>{sendAmountError}</Field.ErrorText>
                </Field.Root>
            </Box>
            <Box>
                <Field.Root invalid={recipientError !== ""}>
                    <Field.Label>Recipient Address</Field.Label>
                    <Input
                        size="sm"
                        placeholder="bze...2a1b"
                        value={recipient}
                        onChange={(e) => onRecipientChange(e.target.value)}
                    />
                    <Field.ErrorText>{recipientError}</Field.ErrorText>
                </Field.Root>
            </Box>

            <Box>
                <Field.Root invalid={memoError !== ""}>
                    <Field.Label>Memo
                        <Field.RequiredIndicator
                            fallback={
                                <Badge size="xs" variant="surface">
                                    Optional
                                </Badge>
                            }
                        />
                    </Field.Label>
                    <Textarea
                        size="sm"
                        placeholder="Transaction memo"
                        rows={3}
                        value={memo}
                        onChange={(e) => onMemoChange(e.target.value)}
                        resize="none"
                    />
                    <Field.ErrorText>{memoError}</Field.ErrorText>
                </Field.Root>
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
}

// Updated Wallet Sidebar Content Component (now fully scrollable)
export const WalletSidebarContent = () => {
    const {
        status,
        username,
        address,
        openView,
    } = useChain(getChainName());

    const {getAssetsBalances} = useBalances();
    const nativeDenom = getChainNativeAssetDenom()
    const sortedBalances = getAssetsBalances().sort((a, b) => {
        // 1. Native denom always first
        if (a.denom === nativeDenom) return -1;
        if (b.denom === nativeDenom) return 1;

        // 2. Verified vs non-verified
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;

        // 3. Positive balances vs zero balances
        const aHasBalance = a.amount.gt(0);
        const bHasBalance = b.amount.gt(0);

        if (aHasBalance && !bHasBalance) return -1;
        if (!aHasBalance && bHasBalance) return 1;

        // 4. If both have positive balances, sort by amount descending
        if (aHasBalance && bHasBalance) {
            return a.amount.gt(b.amount) ? -1 : 1;
        }

        // 5. For remaining items (both zero balance), maintain stable sort
        return 0;
    })

    const [viewState, setViewState] = useState<ViewState>('balances')
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false)
    const copyButtonRef = useRef<HTMLButtonElement>(null)

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
                    {sortedBalances.map((bal) => (
                        <BalanceItem key={bal.denom} balance={bal} />
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
            {status === WalletState.Connected && viewState === 'send' && <SendForm balances={sortedBalances} onClose={handleCancel} />}
            {status === WalletState.Connected && viewState === 'ibcSend' && renderIBCSendForm()}
            {status === WalletState.Connected && viewState === 'ibcDeposit' && renderIBCDepositForm()}
        </VStack>
    )
}