'use client';

import React, { useState } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Input,
    Card,
    Badge,
    Button,
    VStack,
    HStack,
    Grid,
    Stack,
    Separator,
    Alert,
    Image
} from '@chakra-ui/react';
import {
    LuSearch,
    LuShield,
    LuClock,
    LuCoins,
    LuTrendingUp,
    LuLock,
    LuGift,
    LuLockOpen,
} from 'react-icons/lu';

interface StakingOpportunity {
    id: string;
    name: string;
    stakeCoin: { symbol: string; logo: string; name: string };
    earnCoin: { symbol: string; logo: string; name: string };
    lockDuration: number;
    dailyDistribution: string;
    estimatedAPR: number;
    minStaking: number;
    verified: boolean;
    isNative: boolean;
    userStake?: { amount: number; rewards: number; status: string; unlockDate?: string } | null;
    totalStaked: string;
    description?: string;
}

const StakingPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaking, setSelectedStaking] = useState<StakingOpportunity | null>(null);
    const [modalType, setModalType] = useState('');
    const [stakeAmount, setStakeAmount] = useState('');

    // Mock data for staking opportunities
    const stakingOpportunities: StakingOpportunity[] = [
        {
            id: 'bze-native',
            name: 'BZE Native Staking',
            stakeCoin: { symbol: 'BZE', logo: '/images/bze_alternative_512x512.png', name: 'BeeZee' },
            earnCoin: { symbol: 'BZE', logo: '/images/bze_alternative_512x512.png', name: 'BeeZee' },
            lockDuration: 21,
            dailyDistribution: '50,000 BZE',
            estimatedAPR: 12.5,
            minStaking: 1000,
            verified: true,
            isNative: true,
            userStake: { amount: 25000, rewards: 156.78, status: 'active' },
            totalStaked: '2.5M BZE',
            description: 'Secure the BeeZee network and earn rewards by staking your BZE tokens.'
        },
        {
            id: 'usdc-pool',
            name: 'USDC Liquidity Pool',
            stakeCoin: { symbol: 'USDC', logo: '/images/token.svg', name: 'USD Coin' },
            earnCoin: { symbol: 'BZE', logo: '/images/bze_alternative_512x512.png', name: 'BeeZee' },
            lockDuration: 30,
            dailyDistribution: '25,000 BZE',
            estimatedAPR: 18.2,
            minStaking: 500,
            verified: true,
            isNative: false,
            userStake: { amount: 5000, rewards: 89.45, status: 'unstaking', unlockDate: '2025-08-15' },
            totalStaked: '850K USDC'
        },
        {
            id: 'eth-pool',
            name: 'Ethereum Staking Pool',
            stakeCoin: { symbol: 'ETH', logo: '/images/logo_320px.png', name: 'Ethereum' },
            earnCoin: { symbol: 'BZE', logo: '/images/bze_alternative_512x512.png', name: 'BeeZee' },
            lockDuration: 45,
            dailyDistribution: '15,000 BZE',
            estimatedAPR: 22.8,
            minStaking: 0.5,
            verified: true,
            isNative: false,
            userStake: null,
            totalStaked: '120 ETH'
        },
        {
            id: 'experimental-pool',
            name: 'High Yield Experimental',
            stakeCoin: { symbol: 'BTC', logo: '/images/token.svg', name: 'Bitcoin' },
            earnCoin: { symbol: 'BZE', logo: '/images/bze_alternative_512x512.png', name: 'BeeZee' },
            lockDuration: 90,
            dailyDistribution: '5,000 BZE',
            estimatedAPR: 45.6,
            minStaking: 0.01,
            verified: false,
            isNative: false,
            userStake: null,
            totalStaked: '5.2 BTC'
        }
    ];

    // Sort opportunities: user stakes first, then native, then by APR
    const sortedOpportunities = [...stakingOpportunities].sort((a, b) => {
        if (a.userStake && !b.userStake) return -1;
        if (!a.userStake && b.userStake) return 1;
        if (a.isNative && !b.isNative) return -1;
        if (!a.isNative && b.isNative) return 1;
        return b.estimatedAPR - a.estimatedAPR;
    });

    const filteredOpportunities = sortedOpportunities.filter(
        opportunity =>
            opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opportunity.stakeCoin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (type: string, staking: StakingOpportunity | null = null) => {
        setModalType(type);
        setSelectedStaking(staking);
        setStakeAmount('');
    };

    const closeModal = () => {
        setModalType('');
        setSelectedStaking(null);
        setStakeAmount('');
    };

    const calculateEstimatedRewards = () => {
        if (!stakeAmount || !selectedStaking) return 0;
        const amount = parseFloat(stakeAmount);
        return (amount * selectedStaking.estimatedAPR / 100 / 365).toFixed(4);
    };

    const StakingCard = ({ opportunity }: { opportunity: StakingOpportunity }) => {
        const hasUserStake = opportunity.userStake;
        const isUnstaking = hasUserStake?.status === 'unstaking';

        return (
            <Card.Root
                borderWidth={hasUserStake ? "2px" : "1px"}
                borderColor={hasUserStake ? "blue.500" : (opportunity.isNative ? "purple.500" : "border")}
                cursor="pointer"
                _hover={{ shadow: "md" }}
                onClick={() => openModal('actions', opportunity)}
            >
                <Card.Header>
                    <HStack justify="space-between" align="start">
                        <VStack align="start" gap="2">
                            <HStack>
                                <Image
                                    src={opportunity.stakeCoin.logo}
                                    alt={opportunity.stakeCoin.name}
                                    boxSize="8"
                                    borderRadius="full"
                                />
                                <VStack align="start" gap="1">
                                    <Heading size="md">{opportunity.name}</Heading>
                                    <HStack>
                                        <Badge colorPalette={opportunity.verified ? 'green' : 'orange'} variant="subtle">
                                            <HStack gap="1">
                                                <LuShield size={12} />
                                                <Text>{opportunity.verified ? 'Verified' : 'Unverified'}</Text>
                                            </HStack>
                                        </Badge>
                                        {opportunity.isNative && (
                                            <Badge colorPalette="purple" variant="subtle">Native</Badge>
                                        )}
                                        {hasUserStake && (
                                            <Badge colorPalette={isUnstaking ? 'orange' : 'blue'} variant="subtle">
                                                {isUnstaking ? 'Unstaking' : 'Active'}
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>
                            </HStack>
                        </VStack>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {opportunity.estimatedAPR}%
                        </Text>
                    </HStack>
                </Card.Header>

                <Card.Body>
                    <VStack align="stretch" gap="3">
                        {hasUserStake && (
                            <Alert.Root status={isUnstaking ? "warning" : "info"} variant="subtle">
                                <Alert.Indicator />
                                <VStack align="start" gap="2" flex="1">
                                    <HStack justify="space-between" width="full">
                                        <Text fontWeight="medium">Your Stake:</Text>
                                        <Text fontWeight="bold">{opportunity.userStake.amount.toLocaleString()} {opportunity.stakeCoin.symbol}</Text>
                                    </HStack>
                                    <HStack justify="space-between" width="full">
                                        <Text fontWeight="medium">Pending Rewards:</Text>
                                        <Text fontWeight="bold" color="green.600">
                                            {opportunity.userStake.rewards} {opportunity.earnCoin.symbol}
                                        </Text>
                                    </HStack>
                                    {hasUserStake && opportunity.userStake && (
                                        <Alert.Title fontSize="sm">Unlocks on {opportunity.userStake.unlockDate}</Alert.Title>
                                    )}
                                </VStack>
                            </Alert.Root>
                        )}

                        <Grid templateColumns="1fr 1fr" gap="4">
                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Lock Duration</Text>
                                </HStack>
                                <Text fontWeight="medium">{opportunity.lockDuration} days</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuCoins size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Daily Distribution</Text>
                                </HStack>
                                <Text fontWeight="medium">{opportunity.dailyDistribution}</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuTrendingUp size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Min. Staking</Text>
                                </HStack>
                                <Text fontWeight="medium">{opportunity.minStaking} {opportunity.stakeCoin.symbol}</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuLock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Total Staked</Text>
                                </HStack>
                                <Text fontWeight="medium">{opportunity.totalStaked}</Text>
                            </VStack>
                        </Grid>

                        <Separator />

                        <HStack>
                            <Image
                                src={opportunity.earnCoin.logo}
                                alt={opportunity.earnCoin.name}
                                boxSize="8"
                                borderRadius="full"
                            />
                            <VStack align="start" gap="0">
                                <Text fontSize="sm" color="gray.600">Earn</Text>
                                <Text fontWeight="medium">{opportunity.earnCoin.symbol}</Text>
                            </VStack>
                        </HStack>
                    </VStack>
                </Card.Body>
            </Card.Root>
        );
    };

    return (
        <Container maxW="6xl" py="8">
            <VStack align="stretch" gap="8">
                {/* Header */}
                <VStack align="start" gap="4">
                    <Heading size="2xl">Crypto Staking</Heading>
                    <Text color="gray.600" fontSize="lg">
                        Earn passive income by staking and locking your tokens
                    </Text>
                </VStack>

                {/* Search */}
                <Box position="relative" maxW="md">
                    <Input
                        placeholder="Search staking opportunities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        paddingLeft="10"
                    />
                    <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" pointerEvents="none">
                        <LuSearch size={16} color="var(--chakra-colors-gray-400)" />
                    </Box>
                </Box>

                {/* Stats Overview */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="6">
                    <Card.Root>
                        <Card.Body>
                            <VStack align="start">
                                <Text color="gray.600">Total Value Staked</Text>
                                <Text fontSize="2xl" fontWeight="bold">$2.8M</Text>
                                <Text fontSize="sm" color="green.500">+12.5% this month</Text>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <VStack align="start">
                                <Text color="gray.600">Your Active Stakes</Text>
                                <Text fontSize="2xl" fontWeight="bold">2</Text>
                                <Text fontSize="sm" color="blue.500">Earning rewards</Text>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <VStack align="start">
                                <Text color="gray.600">Unclaimed Rewards</Text>
                                <Text fontSize="2xl" fontWeight="bold">246.23 BZE</Text>
                                <Text fontSize="sm" color="green.500">≈ $492.46</Text>
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </Grid>

                {/* Staking Cards */}
                <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap="6">
                    {filteredOpportunities.map((opportunity) => (
                        <StakingCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                </Grid>

                {/* Action Modal */}
                {modalType && (
                    <Box
                        position="fixed"
                        inset="0"
                        bg="blackAlpha.600"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        zIndex="modal"
                    >
                        <Card.Root maxW="md" w="full" mx="4">
                            <Card.Header>
                                <HStack justify="space-between" align="center">
                                    <Heading size="lg">
                                        {modalType === 'stake' && 'Stake Tokens'}
                                        {modalType === 'unstake' && 'Unstake Tokens'}
                                        {modalType === 'claim' && 'Claim Rewards'}
                                        {modalType === 'actions' && selectedStaking?.name}
                                    </Heading>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={closeModal}
                                    >
                                        ✕
                                    </Button>
                                </HStack>
                            </Card.Header>

                            <Card.Body>
                                {modalType === 'actions' && selectedStaking && (
                                    <VStack gap="4">
                                        <Text color="gray.600">{selectedStaking.description || 'Manage your staking position'}</Text>

                                        <Stack direction={{ base: 'column', sm: 'row' }} width="full" gap="3">
                                            <Button
                                                flex="1"
                                                colorPalette="blue"
                                                onClick={() => openModal('stake', selectedStaking)}
                                            >
                                                <HStack gap="2">
                                                    <LuLock size={16} />
                                                    <Text>Stake</Text>
                                                </HStack>
                                            </Button>

                                            <Button
                                                flex="1"
                                                variant="outline"
                                                disabled={!selectedStaking.userStake}
                                                onClick={() => openModal('unstake', selectedStaking)}
                                            >
                                                <HStack gap="2">
                                                    <LuLockOpen size={16} />
                                                    <Text>Unstake</Text>
                                                </HStack>
                                            </Button>

                                            <Button
                                                flex="1"
                                                colorPalette="green"
                                                disabled={!selectedStaking.userStake?.rewards}
                                                onClick={() => openModal('claim', selectedStaking)}
                                            >
                                                <HStack gap="2">
                                                    <LuGift size={16} />
                                                    <Text>Claim</Text>
                                                </HStack>
                                            </Button>
                                        </Stack>
                                    </VStack>
                                )}

                                {modalType === 'stake' && selectedStaking && (
                                    <VStack gap="4">
                                        <Text>Enter the amount you want to stake:</Text>
                                        <Input
                                            placeholder={`Min: ${selectedStaking.minStaking} ${selectedStaking.stakeCoin.symbol}`}
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            type="number"
                                        />

                                        {stakeAmount && (
                                            <Alert.Root status="success" variant="subtle">
                                                <Alert.Indicator />
                                                <VStack align="start" gap="2" flex="1">
                                                    <Alert.Title>Estimated Daily Rewards:</Alert.Title>
                                                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                                                        {calculateEstimatedRewards()} {selectedStaking.earnCoin.symbol}
                                                    </Text>
                                                    <Text fontSize="sm" color="gray.600">
                                                        Lock period: {selectedStaking.lockDuration} days
                                                    </Text>
                                                </VStack>
                                            </Alert.Root>
                                        )}

                                        <Button colorPalette="blue" width="full" disabled={!stakeAmount}>
                                            Confirm Stake
                                        </Button>
                                    </VStack>
                                )}

                                {modalType === 'unstake' && selectedStaking && selectedStaking.userStake && (
                                    <VStack gap="4">
                                        <Alert.Root status="warning" variant="subtle">
                                            <Alert.Indicator />
                                            <VStack align="start" gap="1" flex="1">
                                                <Alert.Title>Unstaking Notice</Alert.Title>
                                                <Alert.Description>
                                                    Your funds will be locked for {selectedStaking.lockDuration} days after unstaking.
                                                </Alert.Description>
                                            </VStack>
                                        </Alert.Root>

                                        <Text>Amount to unstake: {selectedStaking.userStake?.amount} {selectedStaking.stakeCoin.symbol}</Text>

                                        <Button colorPalette="red" width="full">
                                            Confirm Unstake
                                        </Button>
                                    </VStack>
                                )}

                                {modalType === 'claim' && selectedStaking && selectedStaking.userStake && (
                                    <VStack gap="4">
                                        <Text>Available rewards to claim:</Text>
                                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                            {selectedStaking.userStake?.rewards} {selectedStaking.earnCoin.symbol}
                                        </Text>

                                        <Button colorPalette="green" width="full">
                                            Claim Rewards
                                        </Button>
                                    </VStack>
                                )}
                            </Card.Body>
                        </Card.Root>
                    </Box>
                )}
            </VStack>
        </Container>
    );
};

export default StakingPage;