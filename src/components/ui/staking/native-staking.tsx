import {
    Alert,
    Badge,
    Box, Button,
    Card,
    Grid,
    Heading,
    HStack,
    Image,
    Separator,
    Skeleton, Stack,
    Text,
    VStack
} from "@chakra-ui/react";
import {LuClock, LuCoins, LuGift, LuLock, LuLockOpen, LuShield, LuTrendingUp} from "react-icons/lu";
import React, {useMemo, useState} from "react";
import {NativeStakingData} from "@/types/staking";
import {useAssets} from "@/hooks/useAssets";
import {prettyAmount, uAmountToAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {shortNumberFormat} from "@/utils/formatter";
import {openExternalLink} from "@/utils/functions";

interface NativeStakingCardProps {
    stakingData: NativeStakingData;
    isLoading: boolean;
}

export const NativeStakingCard = ({ stakingData, isLoading }: NativeStakingCardProps) => {
    const [modalType, setModalType] = useState('');

    const hasUserStake = !!stakingData.currentStaking?.staked.amount.gt(0);
    const hasUnbonding = !!stakingData.currentStaking?.unbonding.total.amount.gt(0);
    const hasRewards = !!stakingData.currentStaking?.pendingRewards.amount.gt(0);
    const {nativeAsset} = useAssets()

    const yourStake = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData.currentStaking?.staked.amount, nativeAsset.decimals))} ${nativeAsset.ticker}`
    }, [stakingData.currentStaking?.staked.amount, nativeAsset.decimals, nativeAsset.ticker])

    const pendingRewards = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData.currentStaking?.pendingRewards.amount, nativeAsset.decimals))} ${nativeAsset.ticker}`
    }, [stakingData.currentStaking?.pendingRewards.amount, nativeAsset.decimals, nativeAsset.ticker])

    const pendingUnlock = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData.currentStaking?.unbonding.total.amount, nativeAsset.decimals))} ${nativeAsset.ticker}`
    }, [stakingData.currentStaking?.unbonding.total.amount, nativeAsset.decimals, nativeAsset.ticker])

    const pendingUnlockAlert = useMemo(() => {
        const firstUnlockAmount = prettyAmount(uAmountToAmount(stakingData.currentStaking?.unbonding.firstUnlock.amount?.amount, nativeAsset.decimals))

        return `${firstUnlockAmount} ${nativeAsset.ticker} will be unlocked on ${stakingData.currentStaking?.unbonding.firstUnlock.unlockTime?.toLocaleDateString()} at ${stakingData.currentStaking?.unbonding.firstUnlock.unlockTime?.toLocaleTimeString()}`
    }, [stakingData.currentStaking, nativeAsset])

    const dailyDistribution = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingData.averageDailyDistribution.amount, nativeAsset.decimals))} ${nativeAsset.ticker}`
    }, [stakingData.averageDailyDistribution.amount, nativeAsset.decimals, nativeAsset.ticker])

    const totalStaked = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingData.totalStaked.amount, nativeAsset.decimals))} ${nativeAsset.ticker}`
    }, [stakingData.totalStaked.amount, nativeAsset.decimals, nativeAsset.ticker])

    const openModal = (type: string) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType('');
    };

    return (
        <>
            <Skeleton asChild loading={isLoading}>
            <Card.Root
                borderWidth={hasUserStake ? "2px" : "1px"}
                borderColor={hasUserStake ? "blue.500" : "purple.500"}
                cursor="pointer"
                _hover={{ bg: "bg.muted" }}
                onClick={() => openModal('actions')}
            >
                <Card.Header>
                    <HStack justify="space-between" align="start">
                        <VStack align="start" gap="2">
                            <HStack>
                                <Image
                                    src={'/images/bze_alternative_512x512.png'}
                                    alt={nativeAsset.name}
                                    boxSize="8"
                                    borderRadius="full"
                                />
                                <VStack align="start" gap="1">
                                    <Heading size="md">{'BZE Native Staking'}</Heading>
                                    <HStack>
                                        <Badge colorPalette={'green'} variant="subtle">
                                            <HStack gap="1">
                                                <LuShield size={12} />
                                                <Text>{'Verified'}</Text>
                                            </HStack>
                                        </Badge>
                                        <Badge colorPalette="purple" variant="subtle">Native</Badge>
                                        {hasUserStake && (
                                            <Badge colorPalette={'blue'} variant="subtle">
                                                {'Active'}
                                            </Badge>
                                        )}
                                        {hasUnbonding && (
                                            <Badge colorPalette={'orange'} variant="subtle">
                                                {'Unstaking'}
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>
                            </HStack>
                        </VStack>
                        <HStack gap="2">
                            <Text fontSize="2xs" color="green.500">
                                APR
                            </Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                ~{stakingData.averageApr}%
                            </Text>
                        </HStack>
                    </HStack>
                </Card.Header>

                <Card.Body>
                    <VStack align="stretch" gap="3">
                        {hasUserStake && (
                            <Alert.Root status={"info"} variant="subtle">
                                <Alert.Indicator />
                                <VStack align="start" gap="2" flex="1">
                                    <HStack justify="space-between" width="full">
                                        <Text fontWeight="medium">Your Stake:</Text>
                                        <VStack gap="0">
                                            <Text fontWeight="bold">{yourStake}</Text>
                                        </VStack>
                                    </HStack>
                                    <HStack justify="space-between" width="full">
                                        <Text fontWeight="medium">Pending Rewards:</Text>
                                        <Text fontWeight="bold" color="green.600">
                                            {pendingRewards}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Alert.Root>
                        )}
                        {hasUnbonding && (
                            <Alert.Root status={"warning"} variant="subtle">
                                <Alert.Indicator />
                                <VStack align="start" gap="2" flex="1">
                                    <HStack justify="space-between" width="full">
                                        <Text fontWeight="medium">Pending Unlock:</Text>
                                        <Text fontWeight="bold" color="orange.500">
                                            {pendingUnlock}
                                        </Text>
                                    </HStack>
                                    <Alert.Title fontSize="sm">{pendingUnlockAlert}</Alert.Title>
                                </VStack>
                            </Alert.Root>
                        )}

                        <Grid templateColumns="1fr 1fr" gap="4">
                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Unlock Duration</Text>
                                </HStack>
                                <Text fontWeight="medium">{stakingData.unlockDuration} days</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuCoins size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Daily Distribution</Text>
                                </HStack>
                                <Text fontWeight="medium">~{dailyDistribution}</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuTrendingUp size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Min. Staking</Text>
                                </HStack>
                                <Text fontWeight="medium">No minimum</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuLock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Total Staked</Text>
                                </HStack>
                                <Text fontWeight="medium">{totalStaked}</Text>
                            </VStack>
                        </Grid>

                        <Separator />

                        <HStack justify="space-between" width="full">
                            <HStack>
                                <Image
                                    src={'/images/bze_alternative_512x512.png'}
                                    alt={nativeAsset.name}
                                    boxSize="8"
                                    borderRadius="full"
                                />
                                <VStack align="start" gap="0">
                                    <Text fontSize="sm" color="gray.600">Stake</Text>
                                    <Text fontWeight="medium">{nativeAsset.ticker}</Text>
                                </VStack>
                            </HStack>
                            <HStack>
                                <Image
                                    src={'/images/bze_alternative_512x512.png'}
                                    alt={nativeAsset.name}
                                    boxSize="8"
                                    borderRadius="full"
                                />
                                <VStack align="start" gap="0">
                                    <Text fontSize="sm" color="gray.600">Earn</Text>
                                    <Text fontWeight="medium">{nativeAsset.ticker}</Text>
                                </VStack>
                            </HStack>
                        </HStack>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </Skeleton>
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
                                    {modalType === 'actions' && 'BZE Native Staking'}
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
                            {modalType === 'actions' && (
                                <VStack gap="4">
                                    <Text color="gray.600">{'Secure the BeeZee network and earn rewards by staking your BZE tokens.'}</Text>

                                    <Stack direction={{ base: 'column', sm: 'row' }} width="full" gap="3">
                                        <Button
                                            flex="1"
                                            colorPalette="blue"
                                            onClick={() => openExternalLink('https://staking.getbze.com')}
                                        >
                                            <HStack gap="2">
                                                <LuLock size={16} />
                                                <Text>Stake</Text>
                                            </HStack>
                                        </Button>

                                        <Button
                                            flex="1"
                                            variant="outline"
                                            disabled={!hasUserStake}
                                            onClick={() => openExternalLink('https://staking.getbze.com')}
                                        >
                                            <HStack gap="2">
                                                <LuLockOpen size={16} />
                                                <Text>Unstake</Text>
                                            </HStack>
                                        </Button>

                                        <Button
                                            flex="1"
                                            colorPalette="green"
                                            disabled={!hasRewards}
                                            onClick={() => openModal('claim')}
                                        >
                                            <HStack gap="2">
                                                <LuGift size={16} />
                                                <Text>Claim</Text>
                                            </HStack>
                                        </Button>
                                    </Stack>
                                </VStack>
                            )}

                            {modalType === 'claim' && hasRewards && (
                                <VStack gap="4">
                                    <Text>Available rewards to claim:</Text>
                                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                        {pendingRewards}
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
        </>
    );
};
