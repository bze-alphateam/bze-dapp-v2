'use client';

import React, {useEffect, useState} from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    Input,
    Card,
    Button,
    VStack,
    HStack,
    Grid,
    Stack,
    Alert,
} from '@chakra-ui/react';
import {
    LuSearch,
    LuLock,
    LuGift,
    LuLockOpen,
} from 'react-icons/lu';
import {ListingTitle} from "@/components/ui/listing/title";
import {useNativeStakingData} from "@/hooks/useNativeStakingData";
import {NativeStakingCard} from "@/components/ui/staking/native-staking";
import {RewardsStakingBox} from "@/components/ui/staking/rewards-staking";
import {useRewardsStakingData} from "@/hooks/useRewardsStakingData";
import {useAssets} from "@/hooks/useAssets";
import BigNumber from "bignumber.js";

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

//150 seconds
const STAKING_DATA_RELOAD_INTERVAL = 150_000;

const StakingPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaking, setSelectedStaking] = useState<StakingOpportunity | null>(null);
    const [modalType, setModalType] = useState('');
    const [stakeAmount, setStakeAmount] = useState('');

    const {stakingData, isLoading, reload} = useNativeStakingData()
    const {rewards: stakingRewards, isLoading: isLoadingStakingRewards, addressData} = useRewardsStakingData()
    const {isVerifiedAsset} = useAssets()

    const filteredOpportunities = stakingRewards.filter(
        sr =>
            sr.staking_denom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sr.prize_denom.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const aData = addressData?.active.get(a.reward_id)
        const bData = addressData?.active.get(b.reward_id)
        if (aData && !bData) return -1;
        if (!aData && bData) return 1;

        const aPending = addressData?.unlocking.get(a.reward_id)
        const bPending = addressData?.unlocking.get(b.reward_id)
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        const aVerified = isVerifiedAsset(a.staking_denom) && isVerifiedAsset(a.prize_denom)
        const bVerified = isVerifiedAsset(b.staking_denom) && isVerifiedAsset(b.prize_denom)
        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;

        const stakedA = new BigNumber(a.staked_amount || 0)
        const stakedB = new BigNumber(b.staked_amount || 0)
        if (stakedA.gt(stakedB)) return -1;
        if (stakedA.lt(stakedB)) return 1;

        return 0
    })

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
    }

    useEffect(() => {
        const reloadInterval = setInterval(() => {
            reload()
        }, STAKING_DATA_RELOAD_INTERVAL)

        return () => {
            clearInterval(reloadInterval)
        }
    }, [reload])

    return (
        <Container maxW="7xl" py={8}>
            <VStack align="stretch" gap="8">
                {/* Header */}
                <ListingTitle title={"Crypto Staking"} subtitle={"Earn passive income by staking and locking your tokens"} />

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
                    <NativeStakingCard stakingData={stakingData} isLoading={isLoading} onClaimSuccess={() => reload()} />
                    {!isLoadingStakingRewards && filteredOpportunities.map((sr) => (
                        <RewardsStakingBox
                            key={sr.reward_id}
                            stakingReward={sr}
                            userStake={addressData?.active.get(sr.reward_id)}
                            userUnlocking={addressData?.unlocking.get(sr.reward_id)}
                        />
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