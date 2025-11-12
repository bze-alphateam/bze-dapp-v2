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
import {useAsset} from "@/hooks/useAssets";
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

// Types based on project requirements
type Pool = {
    id: string;
    asset0: {
        symbol: string;
        name: string;
        image: string;
        amount: string;
        usdValue: string;
    };
    asset1: {
        symbol: string;
        name: string;
        image: string;
        amount: string;
        usdValue: string;
    };
    totalLiquidity: string;
    fee: number;
    feeDistribution: {
        lpRewards: number;
        protocol: number;
        buyback: number;
    };
    apr: string;
    volume24h: string;
    fees24h: string;
};

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

// Mock data
const mockPool: Pool = {
    id: 'bze-usdc',
    asset0: {
        symbol: 'BZE',
        name: 'BeeZee',
        image: '/images/bze_alternative_512x512.png',
        amount: '125,847.23',
        usdValue: '$62,923.62',
    },
    asset1: {
        symbol: 'USDC',
        name: 'USD Coin',
        image: '/images/token.svg',
        amount: '62,923.45',
        usdValue: '$62,923.45',
    },
    totalLiquidity: '$125,847.07',
    fee: 0.3,
    feeDistribution: {
        lpRewards: 70,
        protocol: 20,
        buyback: 10,
    },
    apr: '24.5%',
    volume24h: '$1,254,892',
    fees24h: '$3,764.68',
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

const {addLiquidity} = bze.tradebin.MessageComposer.withTypeUrl;

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

const PoolDetailsPageContent = () => {
    const [removePercentage, setRemovePercentage] = useState(50);
    const [selectedLockProgram, setSelectedLockProgram] = useState('');
    const [lockAmount, setLockAmount] = useState('');

    const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'lock'>('add');
    const [addLiquidityBaseAmount, setAddLiquidityBaseAmount] = useState('');
    const [addLiquidityQuoteAmount, setAddLiquidityQuoteAmount] = useState('');
    const [addLiquiditySlippage, setAddLiquiditySlippage] = useState('0.5');
    const [showSlippageEdit, setShowSlippageEdit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {toPoolsPage, idParam} = useNavigationWithParams()
    const {address} = useChain(getChainName())
    const {tx} = useBZETx()
    const {toast} = useToast()
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
    const {balance: baseBalance} = useBalance(pool?.base || '')
    const {balance: quoteBalance} = useBalance(pool?.quote || '')

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
    const baseBalanceAmount = useMemo(() => uAmountToAmount(baseBalance.amount, baseAsset?.decimals || 0), [baseAsset, baseBalance])
    const quoteBalanceAmount = useMemo(() => uAmountToAmount(quoteBalance.amount, quoteAsset?.decimals || 0), [quoteAsset, quoteBalance])

    const onAddLiquidityBaseAmountChange = useCallback((value: string) => {
        setAddLiquidityBaseAmount(value);
        if (value === '') {
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
        if (value === '') {
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
        if (!addLiquidityBaseAmount || !addLiquidityQuoteAmount) return '0';

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
        reload();
        //eslint-disable-next-line
    }, [pool, addLiquidityBaseAmount, addLiquidityQuoteAmount, addLiquiditySlippage, expectedShares, quoteBalance, baseBalance, baseAsset, quoteAsset, address])

    // Custom slider component
    const CustomSlider = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
        <Box w="full">
            <Slider.Root
                min={0}
                max={100}
                step={1}
                value={[value]}
                onValueChange={(details) => onChange(details.value[0])}
                w="full"
            >
                <Slider.Control>
                    <Slider.Track h="2" bg="bg.muted" rounded="full">
                        <Slider.Range bg="blue.500" />
                    </Slider.Track>
                    <Slider.Thumb
                        index={0}
                        boxSize="4"
                        bg="blue.500"
                        _hover={{ bg: "blue.600" }}
                    />
                </Slider.Control>
            </Slider.Root>
        </Box>
    );

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
                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="green.500">{mockUserPosition.earnedFees}</Text>
                                <Button size="sm" variant="outline" colorPalette="green">
                                    Claim
                                </Button>
                            </VStack>
                        </Grid>

                        {mockUserPosition.lockedShares !== '0' && (
                            <Box
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
                                            Staked Position: {mockUserPosition.lockedShares} LP tokens
                                        </Text>
                                        <Text
                                            fontSize="xs"
                                            color="purple.600"
                                            _dark={{ color: "purple.400" }}
                                        >
                                            Earning boosted rewards • Can unstake anytime
                                        </Text>
                                    </VStack>
                                    <Button size="xs" variant="outline" colorPalette="purple">
                                        Unstake
                                    </Button>
                                </HStack>
                            </Box>
                        )}
                    </VStack>
                </Box>

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
                                    Stake Rewards
                                </TabButton>
                            </HStack>
                            <Separator borderColor="border.emphasized" />
                        </VStack>

                        {/* Tab Content */}
                        {activeTab === 'add' && (
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
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddLiquidityBaseAmountChange(e.target.value)}
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
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAddLiquidityQuoteAmountChange(e.target.value)}
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
                        )}

                        {activeTab === 'remove' && (
                            <VStack gap="4" w="full">
                                <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">Remove Liquidity</Text>

                                <VStack w="full" gap="4">
                                    <Box w="full">
                                        <HStack justify="space-between" mb="3">
                                            <Text fontSize="sm" color="fg.muted">Amount to Remove</Text>
                                            <Text fontSize="sm" fontWeight="semibold" color="fg.emphasized">{removePercentage}%</Text>
                                        </HStack>
                                        <CustomSlider
                                            value={removePercentage}
                                            onChange={setRemovePercentage}
                                        />
                                        <HStack justify="space-between" mt="3">
                                            {[25, 50, 75, 100].map((percentage) => (
                                                <Button
                                                    key={percentage}
                                                    size="sm"
                                                    variant={removePercentage === percentage ? "solid" : "outline"}
                                                    onClick={() => setRemovePercentage(percentage)}
                                                >
                                                    {percentage}%
                                                </Button>
                                            ))}
                                        </HStack>
                                    </Box>

                                    <Box w="full" bg="bg.panel" p={{ base: "3", md: "4" }} rounded="lg" borderWidth="1px" borderColor="border">
                                        <Text fontSize="sm" color="fg.muted" mb="3">You will receive:</Text>
                                        <VStack gap="2">
                                            <HStack justify="space-between" w="full">
                                                <Text fontSize="sm" color="fg.muted">{mockPool.asset0.symbol}</Text>
                                                <Text fontSize="sm" fontWeight="semibold" color="fg.emphasized">
                                                    {(parseFloat(mockUserPosition.asset0Amount.replace(',', '')) * removePercentage / 100).toFixed(2)}
                                                </Text>
                                            </HStack>
                                            <HStack justify="space-between" w="full">
                                                <Text fontSize="sm" color="fg.muted">{mockPool.asset1.symbol}</Text>
                                                <Text fontSize="sm" fontWeight="semibold" color="fg.emphasized">
                                                    {(parseFloat(mockUserPosition.asset1Amount.replace(',', '')) * removePercentage / 100).toFixed(2)}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                </VStack>

                                <Button w="full" colorPalette="red" size="lg">
                                    Remove Liquidity
                                </Button>
                            </VStack>
                        )}

                        {activeTab === 'lock' && (
                            <VStack gap="4" w="full">
                                <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">Stake LP Tokens in Reward Programs</Text>

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
