'use client';

import React, {useEffect, useState} from 'react';
import {
    Box,
    Container,
    Text,
    Input,
    Card,
    VStack,
    Grid,
} from '@chakra-ui/react';
import {
    LuSearch,
} from 'react-icons/lu';
import {ListingTitle} from "@/components/ui/listing/title";
import {useNativeStakingData} from "@/hooks/useNativeStakingData";
import {NativeStakingCard} from "@/components/ui/staking/native-staking";
import {RewardsStakingBox} from "@/components/ui/staking/rewards-staking";
import {useRewardsStakingData} from "@/hooks/useRewardsStakingData";
import {useAssets} from "@/hooks/useAssets";
import BigNumber from "bignumber.js";
import {StakingRewardSDKType} from "@bze/bzejs/bze/rewards/store";
import {RewardsStakingActionModal} from "@/components/ui/staking/rewards-staking-modals";

//150 seconds
const STAKING_DATA_RELOAD_INTERVAL = 150_000;

const StakingPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaking, setSelectedStaking] = useState<StakingRewardSDKType | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {stakingData, isLoading, reload} = useNativeStakingData()
    const {rewards: stakingRewards, isLoading: isLoadingStakingRewards, addressData, reload: reloadRewardsStaking} = useRewardsStakingData()
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

    const openModal = (staking: StakingRewardSDKType) => {
        setSelectedStaking(staking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStaking(undefined);
    };


    useEffect(() => {
        const reloadInterval = setInterval(() => {
            reload()
            reloadRewardsStaking()
        }, STAKING_DATA_RELOAD_INTERVAL)

        return () => {
            clearInterval(reloadInterval)
        }
    }, [reload, reloadRewardsStaking])

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
                            onClick={() => openModal(sr)}
                        />
                    ))}
                </Grid>

                {/* Action Modal */}
                {isModalOpen && (
                    <RewardsStakingActionModal
                        stakingReward={selectedStaking}
                        userStake={addressData?.active.get(selectedStaking?.reward_id ?? '')}
                        userUnlocking={addressData?.unlocking.get(selectedStaking?.reward_id ?? '')}
                        onClose={closeModal}
                    />)}
            </VStack>
        </Container>
    );
};

export default StakingPage;