'use client'
import "@interchain-kit/react/styles.css"; // Import styles for the wallet modal
import {InterchainWalletModal, useChain, useWalletModal} from "@interchain-kit/react";
import {
    Badge,
    Box,
    Button,
    createListCollection,
    Field,
    Group,
    HStack,
    Image,
    Input, ListCollection,
    Portal,
    Select,
    Separator,
    Skeleton,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import {LuCopy, LuExternalLink, LuX} from 'react-icons/lu'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {getChainExplorerURL, getChainName} from "@/constants/chain";
import {WalletState} from "@interchain-kit/core";
import {stringTruncateFromCenter} from "@/utils/strings";
import {AssetBalance, useBalances} from "@/hooks/useBalances";
import {useAsset, useIBCChains} from "@/hooks/useAssets";
import {isIbcAsset, isIbcDenom} from "@/utils/denom";
import {Balance} from "@/types/balance";
import {amountToUAmount, prettyAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {useAssetPrice} from "@/hooks/usePrices";
import {getChainNativeAssetDenom} from "@/constants/assets";
import {sanitizeNumberInput} from "@/utils/number";
import {validateBech32Address, validateBZEBech32Address} from "@/utils/address";
import BigNumber from "bignumber.js";
import {useToast} from "@/hooks/useToast";
import {useSDKTx} from "@/hooks/useTx";
import {cosmos} from "@bze/bzejs";
import {openExternalLink} from "@/utils/functions";
import {IBCData} from "@/types/asset";
import {canDepositFromIBC, canSendToIBC} from "@/utils/ibc";

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

const validateAmount = (amount: string, coin: AssetBalance|undefined, onError:(msg: string) => void) => {
    if (!coin) return
    if (amount === "") return

    const amountNumber = BigNumber(amount)
    if (amountNumber.isNaN()) {
        onError('Invalid amount')
        return
    }

    const coinBalance = uAmountToBigNumberAmount(coin.amount, coin.decimals)
    if (coinBalance.isLessThan(amount)) {
        onError('Insufficient balance')
    } else {
        onError('')
    }
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
    const [isLoading, setIsLoading] = useState(false)
    const [selectedCoin, setSelectedCoin] = useState<AssetBalance|undefined>()

    const [sendAmount, setSendAmount] = useState('')
    const [sendAmountError, setSendAmountError] = useState('')

    const [recipient, setRecipient] = useState('')
    const [recipientError, setRecipientError] = useState('')

    const [memo, setMemo] = useState('')
    const [memoError, setMemoError] = useState('')

    //other hooks
    const { toast } = useToast()
    const { status, address } = useChain(getChainName());
    const {tx} = useSDKTx(getChainName());

    // Create collections for selects
    const coinsCollection = createListCollection({
        items: balances.map(item => ({
            label: `${item.ticker} - ${uAmountToBigNumberAmount(item.amount, item?.decimals ?? 0)}`,
            value: item.ticker,
            logo: item.logo
        }))
    })

    const handleSend = async () => {
        if (!isValidForm()) {
            toast.error('Can not send coins!', 'Please check the input data.')
            return
        }

        if (status !== WalletState.Connected) {
            toast.error('Wallet not connected!','Please connect your wallet first.')
            return
        }

        const {send} = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

        const msg = send({
            fromAddress: address,
            toAddress: recipient,
            amount: [{
                denom: selectedCoin?.denom ?? '',
                amount: amountToUAmount(sendAmount, selectedCoin?.decimals ?? 0)
            }],
        })

        setIsLoading(true)
        await tx([msg], {memo: memo.length > 0 ? memo : undefined});

        // Reset form
        resetSendForm()
        setIsLoading(false)
        onClose()
    }

    const handleCancel = () => {
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

    const onCoinSelectChange = (ticker: string) => {
        if (ticker === "") return

        const selectedCoin = balances.find(item => item.ticker === ticker)
        if (selectedCoin) {
            setSelectedCoin(selectedCoin)
            validateAmount(sendAmount, selectedCoin, setSendAmountError)
        }
    }

    const setMaxAmount = () => {
        if (!selectedCoin) return
        const maxAmount = uAmountToBigNumberAmount(selectedCoin.amount, selectedCoin.decimals)
        onAmountChange(maxAmount.toString())
        validateAmount(maxAmount.toString(), selectedCoin, setSendAmountError)
    }

    const onMemoChange = (memo: string) => {
        setMemo(memo)
        if (memo.length > 256) {
            setMemoError('Memo must be less than or equal to 256 characters')
        } else {
            setMemoError('')
        }
    }

    const resetSendForm = () => {
        setSelectedCoin(undefined)
        setSendAmount('')
        setRecipient('')
        setMemo('')
    }

    const isValidForm = () => {
        return selectedCoin &&
            memoError === "" &&
            recipientError === "" &&
            sendAmountError === "" &&
            sendAmount !== "" &&
            recipient !== ""
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
                    disabled={isLoading}
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
                            <Select.ValueText placeholder="Select coin" />
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
                            onBlur={() => validateAmount(sendAmount, selectedCoin, setSendAmountError)}
                        />
                        <Button variant="outline" size="sm" onClick={setMaxAmount} disabled={isLoading}>
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
                    disabled={!isValidForm() || isLoading}
                    loading={isLoading}
                    loadingText={"Sending..."}
                >
                    Send
                </Button>
                <Button
                    size="sm"
                    flex="1"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </HStack>
        </VStack>
    )
}

const IBCSendForm = ({balances, onClose}: {balances: AssetBalance[], onClose: () => void}) => {
    const [isLoading, setIsLoading] = useState(false)
    // IBC Send form state
    const [ibcToken, setIbcToken] = useState<AssetBalance|undefined>()
    const [ibcChain, setIbcChain] = useState('')
    const [ibcAmount, setIbcAmount] = useState('')
    const [sendAmountError, setSendAmountError] = useState('')
    const [ibcRecipient, setIbcRecipient] = useState('')
    const [recipientError, setRecipientError] = useState('')
    const [ibcMemo, setIbcMemo] = useState('')
    const [memoError, setMemoError] = useState('')

    const [selectableChains, setSelectableChains] = useState<IBCData[]>([])

    const {ibcChains} = useIBCChains()
    // Get the main chain connection status to check if wallet is connected
    const {address} = useChain(getChainName())

    const {
        chain: counterpartyChain,
        address: counterpartyAddress,
        wallet: counterpartyWallet,
        status: counterpartyStatus,
    } = useChain(ibcChain !== '' ? ibcChain : getChainName());

    // Auto-trigger wallet connection when chain changes
    useEffect(() => {
        const triggerChainConnection = async () => {
            // Only try to connect if:
            // 1. A chain is selected (different from main chain)
            // 2. The status is Disconnected for this specific chain
            // 3. The wallet is connected to the main chain (user has already connected wallet)
            if (ibcChain && ibcChain !== getChainName() && counterpartyStatus === 'Disconnected' && address) {
                try {
                    const selected = selectableChains.find(data => data.counterparty.chainName === ibcChain)
                    if (!selected) {
                        return
                    }
                    console.log('Triggering connection for chain:', ibcChain, counterpartyChain.chainId)
                    await counterpartyWallet.connect(counterpartyChain.chainId)
                } catch (error) {
                    console.error('Failed to connect to chain:', error)
                }
            }
        }

        triggerChainConnection()
    }, [ibcChain, address, counterpartyStatus, counterpartyWallet, selectableChains, counterpartyChain])

    const getIbcTokensList = useCallback((): ListCollection<{
        label: string;
        value: string;
        logo: string;
    }> => {
        return createListCollection({
            items: balances.map(token => ({
                label: `${token.ticker} - ${token.name}`,
                value: token.ticker,
                logo: token.logo
            }))
        })
    }, [balances])

    const getSelectedCoinIbcChains = useCallback((): ListCollection<{
        label: string;
        value: string;
    }> => {
        return createListCollection({items: selectableChains.map(data => ({
                label: data.counterparty.chainPrettyName,
                value: data.counterparty.chainName,
            }))
        })
    }, [selectableChains])

    const handleIBCSend = () => {
        setIsLoading(true)
        console.log('IBC Sending:', { ibcToken, ibcChain, ibcAmount, ibcRecipient, ibcMemo })
        // Handle IBC send logic
        // Reset form
        resetIBCSendForm()
        onClose()
    }

    const resetIBCSendForm = () => {
        setIbcToken(undefined)
        setIbcChain('')
        setIbcAmount('')
        setIbcRecipient('')
        setIbcMemo('')
    }

    const handleCancel = () => {
        // Reset all forms when canceling
        resetIBCSendForm()
        onClose()
    }

    const onCoinSelectChange = (ticker: string) => {
        if (ticker === "") {
            setIbcToken(undefined)
            return;
        }

        const selectedAsset = balances.find(item => item.ticker === ticker)
        if (!selectedAsset) {
            setIbcToken(undefined)
            return;
        }
        setIbcToken(selectedAsset)

        if (isIbcAsset(selectedAsset) && selectedAsset.IBCData && canSendToIBC(selectedAsset.IBCData)) {
            //if it's an IBC asset, allow it to be sent only to it's own chain
            setSelectableChains([selectedAsset.IBCData])
        } else {
            //if it's not an IBC asset (e.g. native token, factory token) allow it to be sent to any chain
            setSelectableChains(ibcChains.filter(ibc => canSendToIBC(ibc) && canDepositFromIBC(ibc)))
        }
    }

    const onAmountChange = (amount: string) => {
        setIbcAmount(sanitizeNumberInput(amount))
        setSendAmountError('')
    }

    const setMaxAmount = () => {
        if (!ibcToken) return
        const maxAmount = uAmountToBigNumberAmount(ibcToken.amount, ibcToken.decimals)
        onAmountChange(maxAmount.toString())
        validateAmount(maxAmount.toString(), ibcToken, setSendAmountError)
    }

    const onRecipientChange = (recipient: string) => {
        setIbcRecipient(recipient)
        if (recipient.length === 0) {
            setRecipientError('')
            return
        }

        validateRecipient(recipient)
    }

    const validateRecipient = (recipient: string) => {
        const validate = validateBech32Address(recipient, counterpartyChain.bech32Prefix ?? "cosmos")
        // const validate = validateBZEBech32Address(recipient)
        if (validate.isValid) {
            setRecipientError('')
        } else {
            setRecipientError(validate.message)
        }
    }

    const onMemoChange = (memo: string) => {
        setIbcMemo(memo)
        if (memo.length > 256) {
            setMemoError('Memo must be less than or equal to 256 characters')
        } else {
            setMemoError('')
        }
    }

    const isValidForm = () => {
        return ibcToken &&
            memoError === "" &&
            recipientError === "" &&
            sendAmountError === "" &&
            ibcAmount !== "" &&
            ibcRecipient !== ""
    }

    const recipientAddressPlaceholder = useMemo(() => {
        if (counterpartyChain.bech32Prefix) {
            return counterpartyChain.bech32Prefix + "...2a1b"
        }

        return "cosmos" + "...2a1b"
    }, [counterpartyChain] )

    const onChainSelect = (chainName: string) => {
        setIbcChain(chainName)
    }

    useEffect(() => {
        if (ibcRecipient !== "") {
            validateRecipient(ibcRecipient)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ibcChain])

    return (
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
                <Select.Root
                    collection={getIbcTokensList()}
                    size="sm"
                    value={ibcToken?.ticker ? [ibcToken.ticker] : []}
                    onValueChange={(details) => onCoinSelectChange(details.value[0] || '')}
                >
                    <Select.Label>Coin</Select.Label>
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText placeholder="Select IBC coin" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content>
                                {getIbcTokensList().items.map((item) => (
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
                <Select.Root
                    collection={getSelectedCoinIbcChains()}
                    size="sm"
                    value={ibcChain ? [ibcChain] : []}
                    onValueChange={(details) => onChainSelect(details.value[0] || '')}
                >
                    <Select.Label>Destination Chain</Select.Label>
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText placeholder="Select destination chain" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content>
                                {getSelectedCoinIbcChains().items.map((item) => (
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
                <Field.Root invalid={sendAmountError !== ""}>
                    <Field.Label>Amount</Field.Label>
                    <Group attached w="full" maxW="sm">
                        <Input
                            size="sm"
                            placeholder="Amount to send"
                            value={ibcAmount}
                            onChange={(e) => setIbcAmount(e.target.value)}
                            onBlur={() => validateAmount(ibcAmount, ibcToken, setSendAmountError)}
                        />
                        <Button variant="outline" size="sm" onClick={setMaxAmount} disabled={isLoading}>
                            Max
                        </Button>
                    </Group>
                    <Field.ErrorText>{sendAmountError}</Field.ErrorText>
                </Field.Root>
            </Box>

            <Box>
                <Field.Root invalid={recipientError !== ""}>
                    <Field.Label>Recipient Address</Field.Label>
                    <Group attached w="full" maxW="sm">
                        <Input
                            size="sm"
                            placeholder={recipientAddressPlaceholder}
                            value={ibcRecipient}
                            onChange={(e) => onRecipientChange(e.target.value)}
                        />
                        <Button variant="outline" size="sm" onClick={() => onRecipientChange(counterpartyAddress)} disabled={isLoading || !counterpartyAddress}>
                            Me
                        </Button>
                    </Group>
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
                        value={ibcMemo}
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
                    onClick={handleIBCSend}
                    colorPalette="blue"
                    disabled={!isValidForm() || isLoading}
                    loading={isLoading}
                    loadingText={"Sending..."}
                >
                    Send
                </Button>
                <Button
                    size="sm"
                    flex="1"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
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

    const {getAssetsBalances, isLoading: assetsLoading} = useBalances();
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

    // IBC Deposit form state
    const [depositChain, setDepositChain] = useState('')
    const [depositToken, setDepositToken] = useState('')
    const [depositAmount, setDepositAmount] = useState('')

    const { open } = useWalletModal();

    const walletAddress = stringTruncateFromCenter(address ?? "", 16)

    const chainCollection = createListCollection({
        items: mockIBCChains
    })

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address)
        setShowCopiedTooltip(true)
        setTimeout(() => setShowCopiedTooltip(false), 2000)
    }

    const handleIBCDeposit = () => {
        console.log('IBC Deposit:', { depositChain, depositToken, depositAmount })
        // Handle IBC deposit logic
        setViewState('balances')
        // Reset form
        resetIBCDepositForm()
    }

    const resetIBCDepositForm = () => {
        setDepositChain('')
        setDepositToken('')
        setDepositAmount('')
    }

    const handleCancel = () => {
        // Reset all forms when canceling
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
                        disabled={assetsLoading}
                    >
                        Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcSend')}
                        w="full"
                        disabled={assetsLoading}
                    >
                        IBC Send
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewState('ibcDeposit')}
                        w="full"
                        disabled={assetsLoading}
                    >
                        IBC Deposit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        w="full"
                        onClick={() => openExternalLink(`${getChainExplorerURL(getChainName())}/account/${address}`)}
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
            {status === WalletState.Connected && viewState === 'ibcSend' && <IBCSendForm balances={sortedBalances} onClose={handleCancel} />}
            {status === WalletState.Connected && viewState === 'ibcDeposit' && renderIBCDepositForm()}
        </VStack>
    )
}