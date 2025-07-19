'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
    IconButton,
} from '@chakra-ui/react';
import {
    LuArrowLeft,
    LuPlus,
    LuMinus,
    LuLock,
    LuTrendingUp,
    LuInfo,
    LuRefreshCw,
} from 'react-icons/lu';
import { Tooltip } from '@/components/ui/tooltip';
import {useRouter} from "next/navigation";
import NextLink from "next/link";

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

// Mock user balances
const mockUserBalances = {
    [mockPool.asset0.symbol]: '5,247.83',
    [mockPool.asset1.symbol]: '2,845.92',
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

export default function PoolDetailsPage() {
    const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'lock'>('add');
    const [addAsset0Amount, setAddAsset0Amount] = useState('');
    const [addAsset1Amount, setAddAsset1Amount] = useState('');
    const [removePercentage, setRemovePercentage] = useState(50);
    const [selectedLockProgram, setSelectedLockProgram] = useState('');
    const [lockAmount, setLockAmount] = useState('');
    const router = useRouter();

    const AssetDisplay = ({ asset, amount, usdValue }: { asset: Pool['asset0']; amount: string; usdValue: string }) => (
        <VStack bg="bg.surface" p="4" rounded="lg" flex="1" align="center" gap="3">
            <Box position="relative" w="12" h="12">
                <Image
                    src={asset.image}
                    alt={asset.symbol}
                    fill
                    style={{ objectFit: 'contain', borderRadius: '50%' }}
                />
            </Box>
            <VStack align="center" gap="2" textAlign="center">
                <HStack>
                    <Text fontWeight="bold" color="fg.emphasized">{asset.symbol}</Text>
                    <Text fontSize="sm" color="fg.muted">{asset.name}</Text>
                </HStack>
                <VStack align="center" gap="1">
                    <Text fontSize="lg" fontWeight="semibold" color="fg.emphasized">{amount}</Text>
                    <Text fontSize="sm" color="fg.muted">{usdValue}</Text>
                </VStack>
            </VStack>
        </VStack>
    );

    // Custom slider component
    const CustomSlider = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
        <Box w="full">
            <Box
                as="input"
                type="range"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseInt(e.target.value))}
                w="full"
                h="2"
                bg="bg.muted"
                rounded="full"
                cursor="pointer"
                css={{
                    '&::-webkit-slider-thumb': {
                        appearance: 'none',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--chakra-colors-blue-500)',
                        cursor: 'pointer',
                    },
                    '&::-moz-range-thumb': {
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--chakra-colors-blue-500)',
                        cursor: 'pointer',
                        border: 'none',
                    },
                }}
            />
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
                        onClick={() => router.push('/pools')}
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
                                <AssetDisplay
                                    asset={mockPool.asset0}
                                    amount={mockPool.asset0.amount}
                                    usdValue={mockPool.asset0.usdValue}
                                />
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
                                <AssetDisplay
                                    asset={mockPool.asset1}
                                    amount={mockPool.asset1.amount}
                                    usdValue={mockPool.asset1.usdValue}
                                />
                            </HStack>
                        </VStack>

                        {/* Pool Stats */}
                        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={{ base: "3", md: "4" }} w="full">
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Total Liquidity</Text>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">{mockPool.totalLiquidity}</Text>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Volume (24h)</Text>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">{mockPool.volume24h}</Text>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Fees (24h)</Text>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="fg.emphasized">{mockPool.fees24h}</Text>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <HStack justify="center">
                                    <Text fontSize="sm" color="fg.muted">APR</Text>
                                    <LuTrendingUp size={16} />
                                </HStack>
                                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="green.500">{mockPool.apr}</Text>
                            </VStack>
                        </Grid>

                        {/* Fee Information */}
                        <Box w="full" bg="bg.panel" p={{ base: "3", md: "4" }} rounded="lg" borderWidth="1px" borderColor="border">
                            <VStack gap={{ base: "3", md: "4" }}>
                                <HStack w="full" justify="space-between">
                                    <Text fontWeight="semibold" color="fg.emphasized" fontSize={{ base: "sm", md: "md" }}>Trading Fee: {mockPool.fee}%</Text>
                                    <IconButton size="xs" variant="ghost">
                                        <LuRefreshCw />
                                    </IconButton>
                                </HStack>
                                <Separator borderColor="border.emphasized" />
                                <Grid templateColumns="repeat(3, 1fr)" gap={{ base: "2", md: "4" }} w="full">
                                    <Tooltip content="Rewards distributed to liquidity providers">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">LP Rewards</Text>
                                            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="green.500">{mockPool.feeDistribution.lpRewards}%</Text>
                                        </VStack>
                                    </Tooltip>
                                    <Tooltip content="Fees used for protocol development and maintenance">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">Protocol</Text>
                                            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.500">{mockPool.feeDistribution.protocol}%</Text>
                                        </VStack>
                                    </Tooltip>
                                    <Tooltip content="Fees used to buyback and burn BZE tokens">
                                        <VStack align="center" gap="2" cursor="pointer">
                                            <Text fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center">Buyback & Burn</Text>
                                            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="orange.500">{mockPool.feeDistribution.buyback}%</Text>
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
                            <Text fontSize="lg" fontWeight="bold" color="fg.emphasized">Your Position</Text>
                            <Badge variant="surface" colorPalette="green">Active</Badge>
                        </HStack>

                        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={{ base: "3", md: "4" }} w="full">
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">LP Tokens</Text>
                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="fg.emphasized">{mockUserPosition.shares}</Text>
                                <Text fontSize="xs" color="fg.muted">{mockUserPosition.shareOfPool} of pool</Text>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Your Assets</Text>
                                <VStack gap="1">
                                    <Text fontSize="sm" color="fg.emphasized">{mockUserPosition.asset0Amount} {mockPool.asset0.symbol}</Text>
                                    <Text fontSize="sm" color="fg.emphasized">{mockUserPosition.asset1Amount} {mockPool.asset1.symbol}</Text>
                                </VStack>
                            </VStack>
                            <VStack align="center" gap="2" p={{ base: "3", md: "4" }} bg="bg.panel" rounded="lg" borderWidth="1px" borderColor="border">
                                <Text fontSize="sm" color="fg.muted" textAlign="center">Earned Fees</Text>
                                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" color="green.500">{mockUserPosition.earnedFees}</Text>
                                <Button size="sm" variant="outline" colorPalette="green">
                                    Claim Fees
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
                                            <Text fontSize="sm" color="fg.muted">{mockPool.asset0.symbol} Amount</Text>
                                            <Text fontSize="xs" color="fg.muted">Available: {mockUserBalances[mockPool.asset0.symbol]}</Text>
                                        </HStack>
                                        <HStack>
                                            <Input
                                                placeholder="0.0"
                                                value={addAsset0Amount}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddAsset0Amount(e.target.value)}
                                                flex="1"
                                            />
                                            <Button variant="outline" size="sm">MAX</Button>
                                        </HStack>
                                    </Box>

                                    <Box fontSize="lg" color="fg.muted" fontWeight="bold" textAlign="center">+</Box>

                                    <Box w="full">
                                        <HStack justify="space-between" mb="2">
                                            <Text fontSize="sm" color="fg.muted">{mockPool.asset1.symbol} Amount</Text>
                                            <Text fontSize="xs" color="fg.muted">Available: {mockUserBalances[mockPool.asset1.symbol]}</Text>
                                        </HStack>
                                        <HStack>
                                            <Input
                                                placeholder="0.0"
                                                value={addAsset1Amount}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddAsset1Amount(e.target.value)}
                                                flex="1"
                                            />
                                            <Button variant="outline" size="sm">MAX</Button>
                                        </HStack>
                                    </Box>
                                </VStack>

                                <Button w="full" colorPalette="blue" size="lg">
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
                                                                        {program.description}. You can unstake anytime, but there's an unstaking period before you receive your tokens.
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