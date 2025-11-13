'use client';

import React, {Suspense, useCallback, useMemo, useState} from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Grid,
    Badge,
    Separator,
    NativeSelectRoot,
    NativeSelectField,
    Slider, Skeleton,
} from '@chakra-ui/react';
import {
    LuArrowLeft,
    LuPlus,
    LuMinus,
    LuLock,
    LuTrendingUp,
    LuInfo, LuSettings,
} from 'react-icons/lu';
import { Tooltip } from '@/components/ui/tooltip';
import {useNavigationWithParams} from "@/hooks/useNavigation";
import {Asset, LP_ASSETS_DECIMALS} from "@/types/asset";
import {TokenLogo} from "@/components/ui/token_logo";
import {useLiquidityPool} from "@/hooks/useLiquidityPools";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {useAssetPrice} from "@/hooks/usePrices";
import {amountToBigNumberUAmount, amountToUAmount, prettyAmount, toBigNumber, uAmountToAmount} from "@/utils/amount";
import BigNumber from "bignumber.js";
import {sanitizeNumberInput, toPercentage} from "@/utils/number";
import {useBalance} from "@/hooks/useBalances";
import {useBZETx} from "@/hooks/useTx";
import {useToast} from "@/hooks/useToast";
import {bze} from "@bze/bzejs";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import {AddressRewardsStaking, ExtendedPendingUnlockParticipantSDKType} from "@/types/staking";
import {RewardsStakingUnlockAlerts} from "@/components/ui/staking/rewards-staking-alerts";
import {useRewardsStakingData} from "@/hooks/useRewardsStakingData";
import {StakingRewardSDKType} from "@bze/bzejs/bze/rewards/store";
import {calculateRewardsStakingPendingRewards} from "@/utils/staking";
import {PrettyBalance} from "@/types/balance";
import {useAssetsValue} from "@/hooks/useAssetsValue";
import {RewardsStakingPendingRewardsModal} from "@/components/ui/staking/rewards-staking-modals";

type UserPosition = {
    shares: string;
    shareOfPool: string;
    asset0Amount: string;
    asset1Amount: string;
    earnedFees: string;
    lockedShares: string;
    lockExpiry?: Date;
};

type LockingProgram = {
    id: string;
    duration: string;
    multiplier: string;
    apr: string;
    description: string;
};

const mockUserPosition: UserPosition = {
    shares: '1,234.56',
    shareOfPool: '1.96%',
    asset0Amount: '2,467.83',
    asset1Amount: '1,233.92',
    earnedFees: '$73.82',
    lockedShares: '567.89',
    lockExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const lockingPrograms: LockingProgram[] = [
    {
        id: '30d',
        duration: '30 days',
        multiplier: '1.2x',
        apr: '29.4%',
        description: 'Flexible staking with 7-day unstaking period',
    },
    {
        id: '90d',
        duration: '90 days',
        multiplier: '1.5x',
        apr: '36.8%',
        description: 'Higher rewards with 14-day unstaking period',
    },
    {
        id: '180d',
        duration: '180 days',
        multiplier: '2.0x',
        apr: '49.0%',
        description: 'Premium rewards with 21-day unstaking period',
    },
    {
        id: '365d',
        duration: '1 year',
        multiplier: '3.0x',
        apr: '73.5%',
        description: 'Maximum rewards with 30-day unstaking period',
    },
];

const AssetDisplay = ({ asset, amount, usdValue }: { asset?: Asset; amount: string; usdValue: BigNumber }) => (
    <VStack bg="bg.surface" p="4" rounded="lg" flex="1" align="center" gap="3">
        <Box position="relative" w="12" h="12">
            <TokenLogo
                src={asset?.logo}
                symbol={asset?.ticker || ''}
                style={{ objectFit: 'contain', borderRadius: '50%' }}
            />
        </Box>
        <VStack align="center" gap="2" textAlign="center">
            <HStack>
                <Text fontWeight="bold" color="fg.emphasized">{asset?.ticker}</Text>
                <Text fontSize="sm" color="fg.muted">{asset?.name}</Text>
            </HStack>
            <VStack align="center" gap="1">
                <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">{prettyAmount(amount)}</Text>
                {usdValue.gt(0) && (<Text fontSize="sm" color="fg.muted">{prettyAmount(usdValue)}</Text>)}
            </VStack>
        </VStack>
    </VStack>
);

const {addLiquidity, removeLiquidity} = bze.tradebin.MessageComposer.withTypeUrl;

interface AddLiquidityTabProps {
    baseAsset?: Asset;
    quoteAsset?: Asset;
    pool?: LiquidityPoolSDKType;

    onAddLiquiditySuccess?: () => void;
    calculateSharesFromAmounts?: (baseAmount: string | BigNumber, quoteAmount: string | BigNumber) => BigNumber
    calculateOppositeAmount?: (amount: string | BigNumber, isBase: boolean) => BigNumber;
}
const AddLiquidityTab = ({baseAsset, quoteAsset, pool, calculateSharesFromAmounts, onAddLiquiditySuccess, calculateOppositeAmount}: AddLiquidityTabProps) => {
    const [addLiquidityBaseAmount, setAddLiquidityBaseAmount] = useState('');
    const [addLiquidityQuoteAmount, setAddLiquidityQuoteAmount] = useState('');
    const [addLiquiditySlippage, setAddLiquiditySlippage] = useState('0.5');
    const [showSlippageEdit, setShowSlippageEdit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {address} = useChain(getChainName())
    const {tx} = useBZETx()
    const {toast} = useToast()
    const {balance: baseBalance} = useBalance(pool?.base || '')
    const {balance: quoteBalance} = useBalance(pool?.quote || '')

    const baseBalanceAmount = useMemo(() => uAmountToAmount(baseBalance.amount, baseAsset?.decimals || 0), [baseAsset, baseBalance])
    const quoteBalanceAmount = useMemo(() => uAmountToAmount(quoteBalance.amount, quoteAsset?.decimals || 0), [quoteAsset, quoteBalance])

    const onAddLiquidityBaseAmountChange = useCallback((value: string) => {
        setAddLiquidityBaseAmount(value);
        if (value === '' || !calculateOppositeAmount) {
            setAddLiquidityQuoteAmount('')
            return
        }
        const oppositeAmount = calculateOppositeAmount(amountToUAmount(value, baseAsset?.decimals || 0), true)
        if (oppositeAmount.lt(0)) {
            setAddLiquidityQuoteAmount('')
            return
        }
        setAddLiquidityQuoteAmount(uAmountToAmount(oppositeAmount, quoteAsset?.decimals || 0))
        //eslint-disable-next-line
    }, [baseAsset, quoteAsset])
    const onAddLiquidityQuoteAmountChange = useCallback((value: string) => {
        setAddLiquidityQuoteAmount(value);
        if (value === '' || !calculateOppositeAmount) {
            setAddLiquidityBaseAmount('')
            return
        }

        const oppositeAmount = calculateOppositeAmount(amountToUAmount(value, quoteAsset?.decimals || 0), false)
        if (oppositeAmount.lt(0)) {
            setAddLiquidityBaseAmount('')
            return
        }
        setAddLiquidityBaseAmount(uAmountToAmount(oppositeAmount, baseAsset?.decimals || 0))
        //eslint-disable-next-line
    }, [baseAsset, quoteAsset])
    const expectedShares = useMemo(() => {
        if (!addLiquidityBaseAmount || !addLiquidityQuoteAmount || !calculateSharesFromAmounts) return '0';

        const baseUAmount = amountToBigNumberUAmount(addLiquidityBaseAmount, baseAsset?.decimals || 0);
        const quoteUAmount = amountToBigNumberUAmount(addLiquidityQuoteAmount, quoteAsset?.decimals || 0);

        const shares = calculateSharesFromAmounts(baseUAmount, quoteUAmount);
        return uAmountToAmount(shares, LP_ASSETS_DECIMALS);
    }, [addLiquidityBaseAmount, addLiquidityQuoteAmount, baseAsset, quoteAsset, calculateSharesFromAmounts]);
    const minimumShares = useMemo(() => {
        if (!expectedShares || expectedShares === '0') return '0';

        const slippageDecimal = toBigNumber(addLiquiditySlippage).dividedBy(100);
        const expected = toBigNumber(expectedShares);
        const minimum = expected.minus(expected.multipliedBy(slippageDecimal));

        return minimum.toString();
    }, [expectedShares, addLiquiditySlippage]);
    const onAddLiquidity = useCallback(async () => {
        if (!pool) return;

        const baseAmountBN = amountToBigNumberUAmount(addLiquidityBaseAmount, baseAsset?.decimals || 0)
        if (baseAmountBN.isNaN() || baseAmountBN.lte(0)) {
            toast.error(`Invalid ${baseAsset?.ticker} amount provided`)
            return
        }

        const quoteAmountBN = amountToBigNumberUAmount(addLiquidityQuoteAmount, quoteAsset?.decimals || 0)
        if (quoteAmountBN.isNaN() || quoteAmountBN.lte(0)) {
            toast.error(`Invalid ${quoteAsset?.ticker} amount provided`)
            return
        }

        const resultedShares = amountToBigNumberUAmount(expectedShares, LP_ASSETS_DECIMALS)
        if (resultedShares.isNaN() || resultedShares.lte(0)) {
            toast.error('amounts are too low. Try again with greater amounts')
            return
        }

        if (baseAmountBN.gt(baseBalance.amount)) {
            toast.error(`You don't have enough ${baseAsset?.ticker} to add liquidity`)
            return
        }

        if (quoteAmountBN.gt(quoteBalance.amount)) {
            toast.error(`You don't have enough ${quoteAsset?.ticker} to add liquidity`)
            return
        }

        const slippageDecimal = toBigNumber(addLiquiditySlippage).dividedBy(100);
        if (slippageDecimal.isNaN() || slippageDecimal.lt(0) || slippageDecimal.gt(1)) {
            toast.error('Slippage must be a valid number between 0 and 100')
            return
        }

        const minExpectedShares = resultedShares.multipliedBy(toBigNumber(1).minus(slippageDecimal));
        if (minExpectedShares.isNaN() || minExpectedShares.lt(0)) {
            toast.error('Something went wrong with slippage calculation. Modify the slippage percentage and try again')
            return
        }

        setIsSubmitting(true)
        const msg = addLiquidity({
            creator: address ?? '',
            poolId: pool.id,
            baseAmount: baseAmountBN.toString(),
            quoteAmount: quoteAmountBN.toString(),
            minLpTokens: minExpectedShares.toFixed(0),
        })

        await tx([msg])

        setIsSubmitting(false)
        if (onAddLiquiditySuccess) onAddLiquiditySuccess()
        //eslint-disable-next-line
    }, [pool, addLiquidityBaseAmount, addLiquidityQuoteAmount, addLiquiditySlippage, expectedShares, quoteBalance, baseBalance, baseAsset, quoteAsset, address])

    return (
        <VStack gap="4" w="full">
            <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">Add Liquidity</Text>

            <VStack w="full" gap="4">
                <Box w="full">
                    <HStack justify="space-between" mb="2">
                        <Text fontSize="sm" color="fg.muted">{baseAsset?.ticker} Amount</Text>
                        <Text fontSize="xs" color="fg.muted">Available: {prettyAmount(baseBalanceAmount)}</Text>
                    </HStack>
                    <HStack>
                        <Input
                            placeholder="0.0"
                            value={addLiquidityBaseAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddLiquidityBaseAmountChange(sanitizeNumberInput(e.target.value))}
                            flex="1"
                            disabled={isSubmitting}
                        />
                        <Button variant="outline" size="sm" onClick={() => onAddLiquidityBaseAmountChange(baseBalanceAmount)}>MAX</Button>
                    </HStack>
                </Box>

                <Box fontSize="lg" color="fg.muted" fontWeight="bold" textAlign="center">+</Box>

                <Box w="full">
                    <HStack justify="space-between" mb="2">
                        <Text fontSize="sm" color="fg.muted">{quoteAsset?.ticker} Amount</Text>
                        <Text fontSize="xs" color="fg.muted">Available: {prettyAmount(quoteBalanceAmount)}</Text>
                    </HStack>
                    <HStack>
                        <Input
                            placeholder="0.0"
                            value={addLiquidityQuoteAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddLiquidityQuoteAmountChange(sanitizeNumberInput(e.target.value))}
                            flex="1"
                            disabled={isSubmitting}
                        />
                        <Button variant="outline" size="sm" onClick={() => onAddLiquidityQuoteAmountChange(quoteBalanceAmount)}>MAX</Button>
                    </HStack>
                </Box>

                {/* Expected Output & Slippage */}
                {addLiquidityBaseAmount && addLiquidityQuoteAmount && (
                    <Box w="full" p="3" bg="bg.muted" borderRadius="md" borderWidth="1px">
                        <VStack align="stretch" gap="2">
                            <HStack justify="space-between">
                                <Text fontSize="sm" color="fg.muted">Expected LP Tokens</Text>
                                <Text fontSize="sm" fontWeight="medium" color="fg.emphasized">
                                    {prettyAmount(expectedShares)} LP
                                </Text>
                            </HStack>

                            <HStack justify="space-between">
                                <HStack gap="1">
                                    <Text fontSize="sm" color="fg.muted">Slippage</Text>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => setShowSlippageEdit(!showSlippageEdit)}
                                        px="1"
                                        disabled={isSubmitting}
                                    >
                                        <LuSettings size={14} />
                                    </Button>
                                </HStack>
                                <Text fontSize="sm" fontWeight="medium" color="fg.emphasized">
                                    {addLiquiditySlippage}%
                                </Text>
                            </HStack>

                            {showSlippageEdit && (
                                <VStack align="stretch" gap="2" pt="2" borderTopWidth="1px">
                                    <HStack gap="2" flexWrap="wrap">
                                        <Button
                                            size="xs"
                                            variant={addLiquiditySlippage === '0.5' ? 'solid' : 'outline'}
                                            onClick={() => setAddLiquiditySlippage('0.5')}
                                            disabled={isSubmitting}
                                        >
                                            0.5%
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant={addLiquiditySlippage === '1' ? 'solid' : 'outline'}
                                            onClick={() => setAddLiquiditySlippage('1')}
                                            disabled={isSubmitting}
                                        >
                                            1%
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant={addLiquiditySlippage === '3' ? 'solid' : 'outline'}
                                            onClick={() => setAddLiquiditySlippage('3')}
                                            disabled={isSubmitting}
                                        >
                                            3%
                                        </Button>
                                        <HStack flex="1" minW="120px">
                                            <Input
                                                size="xs"
                                                placeholder="Custom"
                                                value={addLiquiditySlippage}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddLiquiditySlippage(sanitizeNumberInput(e.target.value))}
                                                maxW="80px"
                                                disabled={isSubmitting}
                                            />
                                            <Text fontSize="xs" color="fg.muted">%</Text>
                                        </HStack>
                                    </HStack>

                                    {parseFloat(addLiquiditySlippage) > 5 && (
                                        <Text fontSize="xs" color="orange.500">
                                            ⚠️ High slippage may result in unfavorable rates
                                        </Text>
                                    )}
                                </VStack>
                            )}

                            <HStack justify="space-between">
                                <Text fontSize="xs" color="fg.muted">Minimum LP Tokens</Text>
                                <Text fontSize="xs" color="fg.muted">
                                    {prettyAmount(minimumShares)} LP
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>
                )}
            </VStack>

            <Button
                w="full"
                colorPalette="blue"
                size="lg"
                onClick={onAddLiquidity}
                disabled={isSubmitting}
            >
                Add Liquidity
            </Button>
        </VStack>
    )
}
interface RemoveLiquidityTabProps {
    pool?: LiquidityPoolSDKType;
    userShares: BigNumber;
    userReserveBase: BigNumber;
    userReserveQuote: BigNumber;
    baseAsset?: Asset;
    quoteAsset?: Asset;
    onRemove: () => void;
}

const RemoveLiquidityTab = ({pool, userShares, userReserveBase, userReserveQuote, baseAsset, quoteAsset, onRemove}: RemoveLiquidityTabProps) => {
    const [removePercentage, setRemovePercentage] = useState(0);
    const [removeAmount, setRemoveAmount] = useState('');
    const [removeSlippage, setRemoveSlippage] = useState('0.5');
    const [showSlippageEdit, setShowSlippageEdit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {address} = useChain(getChainName())
    const {tx} = useBZETx()
    const {toast} = useToast()

    const userSharesAmount = useMemo(() => {
        return uAmountToAmount(userShares, LP_ASSETS_DECIMALS);
    }, [userShares]);

    const estimatedBaseAmount = useMemo(() => {
        if (!removeAmount || removeAmount === '0') {
            return '0';
        }

        const removeUAmount = amountToBigNumberUAmount(removeAmount, LP_ASSETS_DECIMALS);
        const ratio = removeUAmount.dividedBy(userShares);
        return uAmountToAmount(userReserveBase.multipliedBy(ratio), baseAsset?.decimals || 0);
    }, [removeAmount, userShares, userReserveBase, baseAsset]);

    const estimatedQuoteAmount = useMemo(() => {
        if (!removeAmount || removeAmount === '0') {
            return '0';
        }

        const removeUAmount = amountToBigNumberUAmount(removeAmount, LP_ASSETS_DECIMALS);
        const ratio = removeUAmount.dividedBy(userShares);
        return uAmountToAmount(userReserveQuote.multipliedBy(ratio), quoteAsset?.decimals || 0);
    }, [removeAmount, userShares, userReserveQuote, quoteAsset]);

    const minimumBaseAmount = useMemo(() => {
        if (!estimatedBaseAmount || estimatedBaseAmount === '0') return '0';

        const slippageDecimal = toBigNumber(removeSlippage).dividedBy(100);
        const expected = toBigNumber(estimatedBaseAmount);
        const minimum = expected.minus(expected.multipliedBy(slippageDecimal));

        return minimum.toString();
    }, [estimatedBaseAmount, removeSlippage]);

    const minimumQuoteAmount = useMemo(() => {
        if (!estimatedQuoteAmount || estimatedQuoteAmount === '0') return '0';

        const slippageDecimal = toBigNumber(removeSlippage).dividedBy(100);
        const expected = toBigNumber(estimatedQuoteAmount);
        const minimum = expected.minus(expected.multipliedBy(slippageDecimal));

        return minimum.toString();
    }, [estimatedQuoteAmount, removeSlippage]);

    const onPercentageChange = useCallback((percentage: number) => {
        setRemovePercentage(percentage);
        const amount = toBigNumber(userSharesAmount).multipliedBy(percentage).dividedBy(100);
        setRemoveAmount(amount.toString());
    }, [userSharesAmount]);

    const onAmountChange = useCallback((value: string) => {
        setRemoveAmount(value);
        if (!value || value === '0') {
            setRemovePercentage(0);
            return;
        }

        const percentage = toBigNumber(value).dividedBy(userSharesAmount).multipliedBy(100);
        setRemovePercentage(Math.min(100, Math.max(0, percentage.toNumber())));
    }, [userSharesAmount]);

    const canRemove = useMemo(() => !isSubmitting && userShares.gt(0), [isSubmitting, userShares]);

    const handleRemove = useCallback(async () => {
        if (!pool || !address) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!removeAmount || removeAmount === '0') {
            toast.error('Please enter an amount to remove');
            return;
        }

        const removeUAmount = amountToBigNumberUAmount(removeAmount, LP_ASSETS_DECIMALS);
        if (removeUAmount.isNaN() || removeUAmount.lte(0)) {
            toast.error('Invalid shares amount provided');
            return;
        }

        if (removeUAmount.gt(userShares)) {
            toast.error('You don\'t have enough LP shares');
            return;
        }

        const slippageDecimal = toBigNumber(removeSlippage).dividedBy(100);
        if (slippageDecimal.isNaN() || slippageDecimal.lt(0) || slippageDecimal.gt(1)) {
            toast.error('Slippage must be a valid number between 0 and 100');
            return;
        }

        const minBaseUAmount = amountToBigNumberUAmount(minimumBaseAmount, baseAsset?.decimals || 0);
        const minQuoteUAmount = amountToBigNumberUAmount(minimumQuoteAmount, quoteAsset?.decimals || 0);

        setIsSubmitting(true);

        const msg = removeLiquidity({
            creator: address,
            poolId: pool.id,
            lpTokens: removeUAmount.toString(),
            minBase: minBaseUAmount.toFixed(0),
            minQuote: minQuoteUAmount.toFixed(0),
        });

        await tx([msg]);

        setIsSubmitting(false);
        onRemove();
    }, [pool, address, removeAmount, userShares, removeSlippage, minimumBaseAmount, minimumQuoteAmount, baseAsset, quoteAsset, toast, tx, onRemove]);

    return (
        <VStack gap="4" w="full">
            <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">Remove Liquidity</Text>

            <VStack w="full" gap="4">
                <Box w="full">
                    <HStack justify="space-between" mb="2">
                        <Text fontSize="sm" color="fg.muted">LP Shares Amount</Text>
                        <Text fontSize="xs" color="fg.muted">Available: {prettyAmount(userSharesAmount)}</Text>
                    </HStack>
                    <HStack>
                        <Input
                            placeholder="0.0"
                            value={removeAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(sanitizeNumberInput(e.target.value))}
                            flex="1"
                            disabled={!canRemove}
                        />
                        <Button variant="outline" size="sm" onClick={() => onAmountChange(userSharesAmount)} disabled={!canRemove}>MAX</Button>
                    </HStack>
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb="3">
                        <Text fontSize="sm" color="fg.muted">Amount to Remove</Text>
                        <Text fontSize="sm" fontWeight="semibold" color="fg.emphasized">{removePercentage.toFixed(0)}%</Text>
                    </HStack>
                    <Box w="full">
                        <Slider.Root
                            min={0}
                            max={100}
                            step={1}
                            value={[removePercentage]}
                            onValueChange={(e) => onPercentageChange(e.value[0])}
                            w="full"
                            disabled={!canRemove}
                        >
                            <Slider.Control>
                                <Slider.Track h="2" bg="bg.muted" rounded="full">
                                    <Slider.Range bg="blue.500" />
                                </Slider.Track>
                                <Slider.Thumb
                                    index={0}
                                    boxSize="4"
                                    bg="blue.500"
                                    border="2px solid"
                                    borderColor="white"
                                    cursor="pointer"
                                    _focus={{ boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.6)" }}
                                />
                            </Slider.Control>
                        </Slider.Root>
                    </Box>
                    <HStack justify="space-between" mt="3">
                        {[25, 50, 75, 100].map((percentage) => (
                            <Button
                                key={percentage}
                                size="sm"
                                variant={removePercentage === percentage ? "solid" : "outline"}
                                onClick={() => onPercentageChange(percentage)}
                                disabled={!canRemove}
                            >
                                {percentage}%
                            </Button>
                        ))}
                    </HStack>
                </Box>

                {/* Expected Output & Slippage */}
                {removeAmount && removeAmount !== '0' && (
                    <Box w="full" p="3" bg="bg.muted" borderRadius="md" borderWidth="1px">
                        <VStack align="stretch" gap="2">
                            <Text fontSize="sm" color="fg.muted" mb="1">You will receive:</Text>

                            <HStack justify="space-between">
                                <Text fontSize="sm" color="fg.muted">{baseAsset?.ticker}</Text>
                                <Text fontSize="sm" fontWeight="medium" color="fg.emphasized">
                                    {prettyAmount(estimatedBaseAmount)}
                                </Text>
                            </HStack>

                            <HStack justify="space-between">
                                <Text fontSize="sm" color="fg.muted">{quoteAsset?.ticker}</Text>
                                <Text fontSize="sm" fontWeight="medium" color="fg.emphasized">
                                    {prettyAmount(estimatedQuoteAmount)}
                                </Text>
                            </HStack>

                            <Box borderTopWidth="1px" pt="2" mt="1">
                                <HStack justify="space-between">
                                    <HStack gap="1">
                                        <Text fontSize="sm" color="fg.muted">Slippage Tolerance</Text>
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            onClick={() => setShowSlippageEdit(!showSlippageEdit)}
                                            px="1"
                                            disabled={!canRemove}
                                        >
                                            <LuSettings size={14} />
                                        </Button>
                                    </HStack>
                                    <Text fontSize="sm" fontWeight="medium" color="fg.emphasized">
                                        {removeSlippage}%
                                    </Text>
                                </HStack>

                                {showSlippageEdit && (
                                    <VStack align="stretch" gap="2" pt="2" borderTopWidth="1px" mt="2">
                                        <HStack gap="2" flexWrap="wrap">
                                            <Button
                                                size="xs"
                                                variant={removeSlippage === '0.5' ? 'solid' : 'outline'}
                                                onClick={() => setRemoveSlippage('0.5')}
                                                disabled={!canRemove}
                                            >
                                                0.5%
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant={removeSlippage === '1' ? 'solid' : 'outline'}
                                                onClick={() => setRemoveSlippage('1')}
                                                disabled={!canRemove}
                                            >
                                                1%
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant={removeSlippage === '3' ? 'solid' : 'outline'}
                                                onClick={() => setRemoveSlippage('3')}
                                                disabled={!canRemove}
                                            >
                                                3%
                                            </Button>
                                            <HStack flex="1" minW="120px">
                                                <Input
                                                    size="xs"
                                                    placeholder="Custom"
                                                    value={removeSlippage}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoveSlippage(sanitizeNumberInput(e.target.value))}
                                                    maxW="80px"
                                                    disabled={!canRemove}
                                                />
                                                <Text fontSize="xs" color="fg.muted">%</Text>
                                            </HStack>
                                        </HStack>

                                        {parseFloat(removeSlippage) > 5 && (
                                            <Text fontSize="xs" color="orange.500">
                                                ⚠️ High slippage may result in unfavorable rates
                                            </Text>
                                        )}
                                    </VStack>
                                )}

                                <VStack align="stretch" gap="1" mt="2" pt="2" borderTopWidth="1px">
                                    <Text fontSize="xs" color="fg.muted" mb="1">Minimum received:</Text>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs" color="fg.muted">{baseAsset?.ticker}</Text>
                                        <Text fontSize="xs" color="fg.muted">
                                            {prettyAmount(minimumBaseAmount)}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontSize="xs" color="fg.muted">{quoteAsset?.ticker}</Text>
                                        <Text fontSize="xs" color="fg.muted">
                                            {prettyAmount(minimumQuoteAmount)}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>
                )}
            </VStack>

            <Button
                w="full"
                colorPalette="red"
                size="lg"
                onClick={handleRemove}
                disabled={!removeAmount || removeAmount === '0' || isSubmitting || !canRemove}
                loading={isSubmitting}
            >
                Remove Liquidity
            </Button>
        </VStack>
    )
}

interface UserPositionProps {
    userShares: BigNumber;
    userReserveBase: BigNumber;
    userReserveQuote: BigNumber;
    userSharesPercentage: BigNumber|string;
    baseAsset: Asset;
    quoteAsset: Asset;
    pool?: LiquidityPoolSDKType;
    addressRewardsStaking?: AddressRewardsStaking;
    rewardsMap?: Map<string, StakingRewardSDKType>;
    onChange?: () => void;
}
const UserPosition = ({
                          userShares,
                          userSharesPercentage,
                          userReserveBase,
                          userReserveQuote,
                          baseAsset,
                          quoteAsset,
                          addressRewardsStaking,
                          pool,
                          rewardsMap,
                          onChange,
                      } : UserPositionProps) => {

    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [isUnstaking, setIsUnstaking] = useState(false);

    const {denomTicker, denomDecimals} = useAssets()
    const {totalUsdValue} = useAssetsValue()
    const {tx} = useBZETx()
    const {toast} = useToast()
    const {address} = useChain(getChainName())

    const lpSharesPendingUnlock = useMemo(() => {
        const result: ExtendedPendingUnlockParticipantSDKType[] = [];
        if (!addressRewardsStaking || !rewardsMap || !pool?.lp_denom) return result;

        //search for unlocks of the pool lp_denom
        addressRewardsStaking.unlocking.forEach((item, key) => {
            const stakingReward = rewardsMap.get(key)
            if (!stakingReward) return;
            if (stakingReward.staking_denom !== pool.lp_denom) return;

            result.push(...item);
        })

        return result;
    }, [addressRewardsStaking, rewardsMap, pool?.lp_denom])
    const lockedLpShares = useMemo(() => {
        if (!addressRewardsStaking || !rewardsMap || !pool?.lp_denom) return [];

        const result: {stakeAmount: string, earnings: string, lockDays: number, rewardId: string, pendingReward: PrettyBalance}[] = [];
        addressRewardsStaking.active.forEach((item, key) => {
            const stakingReward = rewardsMap.get(key)
            if (!stakingReward) return;
            if (stakingReward.staking_denom !== pool.lp_denom) return;

            const incomePerStakedCoin = new BigNumber(stakingReward.prize_amount).dividedBy(new BigNumber(stakingReward.staked_amount))
            const dailyReward = incomePerStakedCoin.multipliedBy(item.amount)

            result.push({
                stakeAmount: uAmountToAmount(item.amount, LP_ASSETS_DECIMALS),
                earnings: `${uAmountToAmount(dailyReward, denomDecimals(stakingReward.prize_denom))} ${denomTicker(stakingReward.prize_denom)}`,
                lockDays: stakingReward.lock,
                rewardId: item.reward_id,
                pendingReward: {
                    amount: calculateRewardsStakingPendingRewards(stakingReward, item),
                    denom: stakingReward.prize_denom
                }
            });
        })

        return result;
    }, [addressRewardsStaking, denomDecimals, denomTicker, pool?.lp_denom, rewardsMap])
    const extraRewards = useMemo(() => {
        if (lockedLpShares.length === 0) return [];

        const balances: PrettyBalance[] = [];
        lockedLpShares.forEach(item => {
            balances.push(item.pendingReward)
        })

        return balances;
    }, [lockedLpShares])
    const extraRewardsInUsd = useMemo(() => {
        if (extraRewards.length === 0) return '0';

        return prettyAmount(totalUsdValue(extraRewards));
    }, [extraRewards, totalUsdValue])

    const onRewardsClaimSuccess = useCallback(() => {
        if (onChange) onChange();
        setShowRewardsModal(false);
    }, [onChange])

    const unstakeShares = useCallback(async (rewardId: string) => {
        const reward = rewardsMap?.get(rewardId);
        if (!reward) {
            toast.error('Reward not found. Reload the page and try again.');
            return;
        }

        const {exitStaking} = bze.rewards.MessageComposer.withTypeUrl;
        const msg = exitStaking({
            rewardId: reward.reward_id,
            creator: address ?? '',
        })

        setIsUnstaking(true);
        await tx([msg]);
        setIsUnstaking(false);
        if (onChange) onChange();
    }, [address, onChange, rewardsMap, toast, tx])

    return (
        <Box w="full" bg="bg.surface" p={{ base: "4", md: "6" }} rounded="xl" borderWidth="1px" borderColor="border">
            <VStack gap={{ base: "4", md: "6" }}>
                <HStack w="full" justify="space-between">
                    <Text fontSize="lg" fontWeight="bold" color="fg.emphasized">Your Shares</Text>
                    <Badge variant="surface" colorPalette={userShares.gt(0) ? 'green' : 'yellow'}>{userShares.gt(0) ? 'Active' : 'Inactive'}</Badge>
                </HStack>

                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={{ base: "3", md: "4" }} w="full">
                    <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                        <Text fontSize="sm" color="fg.muted" textAlign="center">LP Shares</Text>
                        <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="fg.emphasized">{prettyAmount(uAmountToAmount(userShares, LP_ASSETS_DECIMALS))}</Text>
                        <Text fontSize="xs" color="fg.muted">{prettyAmount(userSharesPercentage)}% of pool</Text>
                    </VStack>
                    <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                        <Text fontSize="sm" color="fg.muted" textAlign="center">Shares Assets</Text>
                        <VStack gap="1">
                            <Text fontSize="sm" color="fg.emphasized">{uAmountToAmount(userReserveBase, baseAsset?.decimals || 0)} {baseAsset?.ticker}</Text>
                            <Text fontSize="sm" color="fg.emphasized">{uAmountToAmount(userReserveQuote, quoteAsset?.decimals || 0)} {quoteAsset?.ticker}</Text>
                        </VStack>
                    </VStack>
                    <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                        <Text fontSize="sm" color="fg.muted" textAlign="center">Extra Rewards</Text>
                        <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="green.500">${extraRewardsInUsd}</Text>
                        <Button size="sm" variant="outline" colorPalette="green" onClick={() => setShowRewardsModal(true)}>
                            Claim
                        </Button>
                    </VStack>
                </Grid>

                {lockedLpShares && lockedLpShares.length > 0 && lockedLpShares.map((item, index) => (
                    <Box
                        key={index}
                        w="full"
                        bg="purple.50"
                        _dark={{ bg: "purple.900/20", borderColor: "purple.600" }}
                        p="4"
                        rounded="lg"
                        borderWidth="1px"
                        borderColor="purple.200"
                    >
                        <HStack>
                            <Box color="purple.500">
                                <LuLock size={20} />
                            </Box>
                            <VStack align="start" gap="1" flex="1">
                                <Text
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    color="purple.700"
                                    _dark={{ color: "purple.300" }}
                                >
                                    Locked: {item.stakeAmount} LP shares
                                </Text>
                                <Text
                                    fontSize="xs"
                                    color="purple.600"
                                    _dark={{ color: "purple.400" }}
                                >
                                    Earning {item.earnings} daily • Unlock period: {item.lockDays} {item.lockDays === 1 ? 'day' : 'days'}
                                </Text>
                            </VStack>
                            <Button
                                size="xs"
                                variant="outline"
                                colorPalette="purple"
                                onClick={() => unstakeShares(item.rewardId)}
                                disabled={isUnstaking}
                                loading={isUnstaking}
                            >
                                Unstake
                            </Button>
                        </HStack>
                    </Box>
                ))}
                {lpSharesPendingUnlock && lpSharesPendingUnlock.length > 0 && (
                    <VStack w="full" gap={"2"}>
                        <RewardsStakingUnlockAlerts ticker={'LP Shares'} decimals={LP_ASSETS_DECIMALS} userUnlocking={lpSharesPendingUnlock}/>
                    </VStack>
                )}
                {showRewardsModal && (
                    <RewardsStakingPendingRewardsModal
                        onClose={() => setShowRewardsModal(false)}
                        pendingRewards={extraRewards}
                        pendingRewardsIds={lockedLpShares.map(item => item.rewardId)}
                        onClaimSuccess={onRewardsClaimSuccess}
                    />
                )}
            </VStack>
        </Box>
    )
}

const PoolDetailsPageContent = () => {
    const [selectedLockProgram, setSelectedLockProgram] = useState('');
    const [lockAmount, setLockAmount] = useState('');

    const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'lock'>('add');

    const {toPoolsPage, idParam} = useNavigationWithParams()

    const {
        pool,
        poolData,
        userShares,
        userSharesPercentage,
        userReserveBase,
        userReserveQuote,
        calculateOppositeAmount,
        calculateSharesFromAmounts,
        reload,
    } = useLiquidityPool(idParam ?? '')
    const {asset: baseAsset, isLoading: isLoadingBaseAsset} = useAsset(pool?.base || '')
    const {asset: quoteAsset, isLoading: isLoadingQuoteAsset} = useAsset(pool?.quote || '')
    const {isUSDC: baseAssetIsUsdc, totalUsdValue: baseAssetTotalUsdcValue, isLoading: baseAssetPriceLoading} = useAssetPrice(pool?.base || '')
    const {isUSDC: quoteAssetIsUsdc, totalUsdValue: quoteAssetTotalUsdcValue, isLoading: quoteAssetPriceLoading} = useAssetPrice(pool?.quote || '')
    const {rewardsMap, addressData, reload: reloadStakingData} = useRewardsStakingData()

    const poolBaseReservesAmount = useMemo(() => {
        if (!pool || !baseAsset) return '0';
        return uAmountToAmount(pool.reserve_base, baseAsset.decimals);
    }, [baseAsset, pool])
    const poolQuoteReservesAmount = useMemo(() => {
        if (!pool || !quoteAsset) return '0';
        return uAmountToAmount(pool.reserve_quote, quoteAsset.decimals);
    }, [pool, quoteAsset])
    const poolBaseReservesUsdValue = useMemo(() => {
        if (baseAssetIsUsdc) return toBigNumber(poolBaseReservesAmount);

        return baseAssetTotalUsdcValue(toBigNumber(poolBaseReservesAmount))
        //eslint-disable-next-line
    }, [poolBaseReservesAmount])
    const poolQuoteReservesUsdValue = useMemo(() => {
        if (quoteAssetIsUsdc) return toBigNumber(poolQuoteReservesAmount);

        return quoteAssetTotalUsdcValue(toBigNumber(poolQuoteReservesAmount))
        //eslint-disable-next-line
    }, [poolQuoteReservesAmount])
    const hasPoolData = useMemo(() => poolData !== undefined, [poolData]);

    const onLiquidityChanged = useCallback(() => {
        reload()
        reloadStakingData()
    }, [reload, reloadStakingData])

    // Custom tabs
    const TabButton = ({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) => (
        <Button
            variant={isActive ? "solid" : "ghost"}
            colorPalette={isActive ? "blue" : undefined}
            onClick={onClick}
            size="sm"
        >
            {children}
        </Button>
    );

    return (
        <Container maxW="4xl" py={{ base: "4", md: "8" }} px={{ base: "4", md: "6" }}>
            <VStack align="start" gap={{ base: "4", md: "6" }} mb={{ base: "4", md: "8" }}>
                {/* Header */}
                <HStack>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toPoolsPage()}
                    >
                        <LuArrowLeft />Pools
                    </Button>
                    <Box h="4" w="1px" bg="border" />
                    <Text ml={2} fontSize="2xl" fontWeight="bold" color="fg.emphasized">Pool Details</Text>
                </HStack>

                {/* Pool Overview */}
                <Box w="full" bg="bg.surface" p={{ base: "4", md: "6" }} rounded="xl" borderWidth="1px" borderColor="border">
                    <VStack gap={{ base: "4", md: "6" }}>
                        {/* Assets Display */}
                        <VStack w="full" gap="4">
                            <HStack
                                w="full"
                                gap={{ base: "2", md: "4" }}
                                align="center"
                                direction={{ base: "column", sm: "row" }}
                            >
                                <Skeleton asChild loading={isLoadingBaseAsset || baseAssetPriceLoading}>
                                    <AssetDisplay
                                        asset={baseAsset}
                                        amount={poolBaseReservesAmount}
                                        usdValue={poolBaseReservesUsdValue}
                                    />
                                </Skeleton>
                                <Box
                                    fontSize={{ base: "xl", md: "2xl" }}
                                    color="fg.muted"
                                    fontWeight="bold"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    minW="6"
                                    py={{ base: "2", sm: "0" }}
                                >
                                    +
                                </Box>
                                <Skeleton asChild loading={isLoadingQuoteAsset || quoteAssetPriceLoading}>
                                    <AssetDisplay
                                        asset={quoteAsset}
                                        amount={poolQuoteReservesAmount}
                                        usdValue={poolQuoteReservesUsdValue}
                                    />
                                </Skeleton>
                            </HStack>
                        </VStack>

                        {/* Pool Stats */}
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={{ base: "3", md: "4" }} w="full">
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Total Liquidity</Text>
                                <Skeleton asChild loading={!hasPoolData}>
                                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">${prettyAmount(poolData?.usdValue || 0)}</Text>
                                </Skeleton>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Volume (24h)</Text>
                                <Skeleton asChild loading={!hasPoolData}>
                                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">${prettyAmount(poolData?.usdVolume || 0)}</Text>
                                </Skeleton>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Fees (24h)</Text>
                                <Skeleton asChild loading={!hasPoolData}>
                                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">${prettyAmount(poolData?.usdFees || 0)}</Text>
                                </Skeleton>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <HStack justify="center">
                                    <Text fontSize="sm" color="fg.muted">APR</Text>
                                    <LuTrendingUp size={16} />
                                </HStack>
                                <Skeleton asChild loading={!hasPoolData}>
                                    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="green.500">{poolData?.apr || 0}%</Text>
                                </Skeleton>
                            </VStack>
                        </Grid>

                        {/* Fee Information */}
                        <Box w="full" bg="bg.panel" p={{ base: "3", md: "4" }} rounded="lg" borderWidth="1px" borderColor="border">
                            <VStack gap={{ base: "3", md: "4" }}>
                                <HStack w="full" justify="space-between">
                                    <Skeleton asChild loading={!pool}>
                                        <Text fontWeight="semibold" color="fg.emphasized" fontSize={{ base: "sm", md: "md" }}>Trading Fee: {toPercentage(pool?.fee || 0)}%</Text>
                                    </Skeleton>
                                </HStack>
                                <Separator borderColor="border.emphasized" />
                                <Grid templateColumns="repeat(3, 1fr)" gap={{ base: "2", md: "4" }} w="full">
                                    <Tooltip content="Rewards distributed to liquidity providers">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">LP Rewards</Text>
                                            <Skeleton asChild loading={!pool}>
                                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="green.500">{toPercentage(pool?.fee_dest?.providers || 0)}%</Text>
                                            </Skeleton>
                                        </VStack>
                                    </Tooltip>
                                    <Tooltip content="Fees used for protocol development and maintenance">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">Protocol</Text>
                                            <Skeleton asChild loading={!pool}>
                                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.500">{toPercentage(pool?.fee_dest?.treasury || 0)}%</Text>
                                            </Skeleton>
                                        </VStack>
                                    </Tooltip>
                                    <Tooltip content="Fees used to buyback and burn BZE tokens">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">Buyback & Burn</Text>
                                            <Skeleton asChild loading={!pool}>
                                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="orange.500">{toPercentage(pool?.fee_dest?.burner || 0)}%</Text>
                                            </Skeleton>
                                        </VStack>
                                    </Tooltip>
                                </Grid>
                            </VStack>
                        </Box>
                    </VStack>
                </Box>

                {/* User Position */}
                {baseAsset && quoteAsset && (
                    <UserPosition
                        userShares={userShares}
                        userReserveBase={userReserveBase}
                        userReserveQuote={userReserveQuote}
                        userSharesPercentage={userSharesPercentage}
                        baseAsset={baseAsset}
                        quoteAsset={quoteAsset}
                        pool={pool}
                        addressRewardsStaking={addressData}
                        rewardsMap={rewardsMap}
                        onChange={onLiquidityChanged}
                    />
                )}

                {/* Actions Tabs */}
                <Box w="full" bg="bg.surface" p={{ base: "4", md: "6" }} rounded="xl" borderWidth="1px" borderColor="border">
                    <VStack gap={{ base: "4", md: "6" }}>
                        {/* Tab Navigation */}
                        <VStack w="full" gap="2">
                            <HStack gap="2" w="full" justify="center" flexWrap="wrap">
                                <TabButton
                                    isActive={activeTab === 'add'}
                                    onClick={() => setActiveTab('add')}
                                >
                                    <LuPlus />
                                    Add Liquidity
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'remove'}
                                    onClick={() => setActiveTab('remove')}
                                >
                                    <LuMinus />
                                    Remove Liquidity
                                </TabButton>
                                <TabButton
                                    isActive={activeTab === 'lock'}
                                    onClick={() => setActiveTab('lock')}
                                >
                                    <LuLock />
                                    Boost Rewards
                                </TabButton>
                            </HStack>
                            <Separator borderColor="border.emphasized" />
                        </VStack>
                        {/* Tab Content */}
                        {activeTab === 'add' && (
                            <AddLiquidityTab
                                baseAsset={baseAsset}
                                quoteAsset={quoteAsset}
                                pool={pool}
                                onAddLiquiditySuccess={onLiquidityChanged}
                                calculateSharesFromAmounts={calculateSharesFromAmounts}
                                calculateOppositeAmount={calculateOppositeAmount}
                            />
                        )}

                        {activeTab === 'remove' && (
                            <RemoveLiquidityTab
                                pool={pool}
                                userShares={userShares}
                                userReserveBase={userReserveBase}
                                userReserveQuote={userReserveQuote}
                                baseAsset={baseAsset}
                                quoteAsset={quoteAsset}
                                onRemove={onLiquidityChanged}
                            />
                        )}

                        {activeTab === 'lock' && (
                            <VStack gap="4" w="full">
                                <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">Lock LP Shares to boost your rewards</Text>

                                <VStack w="full" gap="4">
                                    <Box w="full">
                                        <Text fontSize="sm" color="fg.muted" mb="2">Select Staking Program</Text>
                                        <NativeSelectRoot>
                                            <NativeSelectField
                                                value={selectedLockProgram}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLockProgram(e.target.value)}
                                                placeholder="Choose staking program..."
                                            >
                                                <option value="">Choose staking program...</option>
                                                {lockingPrograms.map((program) => (
                                                    <option key={program.id} value={program.id}>
                                                        {program.duration} - {program.multiplier} rewards ({program.apr} APR)
                                                    </option>
                                                ))}
                                            </NativeSelectField>
                                        </NativeSelectRoot>
                                    </Box>

                                    {selectedLockProgram && (
                                        <Box w="full" bg="bg.panel" p={{ base: "3", md: "4" }} rounded="lg" borderWidth="1px" borderColor="border">
                                            <VStack gap={{ base: "3", md: "4" }}>
                                                {lockingPrograms
                                                    .filter(p => p.id === selectedLockProgram)
                                                    .map(program => (
                                                        <VStack key={program.id} gap={{ base: "3", md: "4" }} w="full">
                                                            <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={{ base: "3", md: "4" }} w="full">
                                                                <VStack align="center" gap="2">
                                                                    <Text fontSize="xs" color="fg.muted" fontWeight="medium">Program Duration</Text>
                                                                    <Text fontSize="sm" fontWeight="semibold" color="fg.emphasized">{program.duration}</Text>
                                                                </VStack>
                                                                <VStack align="center" gap="2">
                                                                    <Text fontSize="xs" color="fg.muted" fontWeight="medium">Reward Multiplier</Text>
                                                                    <Text fontSize="sm" fontWeight="semibold" color="green.500">{program.multiplier}</Text>
                                                                </VStack>
                                                                <VStack align="center" gap="2">
                                                                    <Text fontSize="xs" color="fg.muted" fontWeight="medium">Boosted APR</Text>
                                                                    <Text fontSize="sm" fontWeight="semibold" color="green.500">{program.apr}</Text>
                                                                </VStack>
                                                            </Grid>
                                                            <Box
                                                                w="full"
                                                                bg="yellow.50"
                                                                _dark={{ bg: "yellow.900/20", borderColor: "yellow.600" }}
                                                                p="3"
                                                                rounded="md"
                                                                borderWidth="1px"
                                                                borderColor="yellow.200"
                                                            >
                                                                <HStack>
                                                                    <Box color="orange.500">
                                                                        <LuInfo size={16} />
                                                                    </Box>
                                                                    <Text
                                                                        fontSize="xs"
                                                                        color="yellow.800"
                                                                        _dark={{ color: "yellow.200" }}
                                                                    >
                                                                        {program.description}. You can unstake anytime, but there&#39;s an unstaking period before you receive your tokens.
                                                                    </Text>
                                                                </HStack>
                                                            </Box>
                                                        </VStack>
                                                    ))}
                                            </VStack>
                                        </Box>
                                    )}

                                    <Box w="full">
                                        <HStack justify="space-between" mb="2">
                                            <Text fontSize="sm" color="fg.muted">Amount to Stake</Text>
                                            <Text fontSize="xs" color="fg.muted">Available: {mockUserPosition.shares} LP tokens</Text>
                                        </HStack>
                                        <HStack>
                                            <Input
                                                placeholder="0.0"
                                                value={lockAmount}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLockAmount(e.target.value)}
                                                flex="1"
                                            />
                                            <Button variant="outline" size="sm">MAX</Button>
                                        </HStack>
                                    </Box>
                                </VStack>

                                <Button
                                    w="full"
                                    colorPalette="purple"
                                    size="lg"
                                    disabled={!selectedLockProgram || !lockAmount}
                                >
                                    Stake LP Tokens
                                </Button>
                            </VStack>
                        )}
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
}

const PoolDetailsPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PoolDetailsPageContent />
        </Suspense>
    );
};

export default PoolDetailsPage;
