import {
    StakingRewardParticipantSDKType,
    StakingRewardSDKType
} from "@bze/bzejs/bze/rewards/store";
import {
    Alert,
    Badge, Box,
    Card,
    Grid,
    Heading,
    HStack,
    Separator,
    Skeleton,
    Text,
    VStack
} from "@chakra-ui/react";
import {LuClock, LuCoins, LuLock, LuShield, LuTrendingUp} from "react-icons/lu";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useAsset} from "@/hooks/useAssets";
import {calculateRewardsStakingApr, calculateRewardsStakingPendingRewards} from "@/utils/staking";
import {TokenLogo} from "@/components/ui/token_logo";
import {shortNumberFormat} from "@/utils/formatter";
import {prettyAmount, toBigNumber, uAmountToAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import BigNumber from "bignumber.js";
import {useAssetPrice} from "@/hooks/usePrices";
import {ExtendedPendingUnlockParticipantSDKType} from "@/types/staking";
import {removeLeadingZeros} from "@/utils/strings";

interface RewardsStakingBoxProps {
    stakingReward?: StakingRewardSDKType;
    onClick?: (sr?: StakingRewardSDKType) => void;
    userStake?: StakingRewardParticipantSDKType;
    userUnlocking?: ExtendedPendingUnlockParticipantSDKType[];
}

export const RewardsStakingBox = ({stakingReward, onClick, userStake, userUnlocking} : RewardsStakingBoxProps) => {
    const [isLoading, setIsLoading] = useState(true)

    const {asset: stakingAsset, isLoading: stakingAssetIsLoading} = useAsset(stakingReward?.staking_denom ?? '')
    const {asset: prizeAsset, isLoading: prizeAssetIsLoading} = useAsset(stakingReward?.prize_denom ?? '')
    const {uAmountUsdValue: stakingAssetValue, hasPrice: stakingAssetHasPrice} = useAssetPrice(stakingReward?.staking_denom ?? "")
    const {uAmountUsdValue: prizeAssetValue, hasPrice: prizeAssetHasPrice} = useAssetPrice(stakingReward?.prize_denom ?? "")

    const onBoxClick = useCallback(() => {
        if (onClick && stakingReward) {
            onClick(stakingReward)
        }
    }, [stakingReward, onClick])

    const calculatedApr = useMemo(() => {
        if (!stakingReward) {
            return ""
        }

        let prizeAmount = new BigNumber(stakingReward.prize_amount)
        let stakedAmount = new BigNumber(stakingReward.staked_amount)
        if (stakingReward.prize_denom !== stakingReward.staking_denom) {
            //if we have different denoms we need to transform the amounts in USD so we can calculate the APR
            if (!stakingAssetHasPrice || !prizeAssetHasPrice) {
                return ""
            }

            stakedAmount = stakingAssetValue(stakedAmount, stakingAsset?.decimals ?? 0)
            prizeAmount = prizeAssetValue(prizeAmount, prizeAsset?.decimals ?? 0)
            if (prizeAmount.isNaN() || !prizeAmount.gt(0)) {
                return ""
            }
        }

        if (stakedAmount.isNaN() || !stakedAmount.gt(0)) {
            return ""
        }

        const apr = calculateRewardsStakingApr(prizeAmount, stakedAmount)

        return `~${apr.toString()}%`
    }, [prizeAsset?.decimals, prizeAssetHasPrice, prizeAssetValue, stakingAsset?.decimals, stakingAssetHasPrice, stakingAssetValue, stakingReward])
    const dailyDistribution = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingReward?.prize_amount, prizeAsset?.decimals || 0))} ${prizeAsset?.ticker}`
    }, [stakingReward, prizeAsset])
    const minStake = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingReward?.min_stake, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [stakingReward, stakingAsset])
    const totalStaked = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingReward?.staked_amount, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [stakingReward, stakingAsset])
    const hasUserStake = useMemo(() => !!userStake, [userStake])
    const hasUnbonding = useMemo(() => !!userUnlocking, [userUnlocking])
    const yourStake = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(userStake?.amount, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [userStake, stakingAsset])
    const pendingUnlock = useMemo(() => {
        let allAmounts = toBigNumber(0)
        if (userUnlocking) {
            for (const unlock of userUnlocking) {
                allAmounts = allAmounts.plus(unlock.amount)
            }
        }

        return `${prettyAmount(uAmountToAmount(allAmounts, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [userUnlocking, stakingAsset])
    const pendingRewards = useMemo(() => {
        const rewardsToClaim = calculateRewardsStakingPendingRewards(stakingReward, userStake)
        if (rewardsToClaim.isZero()) {
            return `0 ${prizeAsset?.ticker}`;
        }

        return `${prettyAmount(uAmountToAmount(rewardsToClaim, prizeAsset?.decimals || 0))} ${prizeAsset?.ticker}`
    }, [stakingReward, userStake, prizeAsset])
    const rewardNumber = useMemo(() => {
        return removeLeadingZeros(stakingReward?.reward_id ?? '000')
    }, [stakingReward])

    const remainingDays = useMemo(() => {
        if (!stakingReward) {
            return 0
        }

        return stakingReward.duration - stakingReward.payouts
    }, [stakingReward])

    useEffect(() => {
        if (stakingReward && !stakingAssetIsLoading && !prizeAssetIsLoading) {
            setIsLoading(false)
        }
    }, [stakingReward, stakingAssetIsLoading, prizeAssetIsLoading])

    return (
        <Skeleton asChild loading={isLoading}>
            <Card.Root
                borderWidth={hasUserStake ? "2px" : "1px"}
                borderColor={hasUserStake ? "blue.500" : (hasUnbonding ? "orange.500" : "border")}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                    bg: "bg.muted",
                    transform: "translateY(-2px)",
                    shadow: "lg"
                }}
                onClick={onBoxClick}
                shadow="sm"
            >
                <Card.Header pb="4">
                    <HStack justify="space-between" align="start" gap="4">
                        <VStack align="start" gap="3" flex="1">
                            <HStack gap="3">
                                <Box
                                    p="2"
                                    bg="bg.subtle"
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="border"
                                >
                                    <TokenLogo src={stakingAsset?.logo} symbol={stakingAsset?.ticker ?? ''}/>
                                </Box>
                                <VStack align="start" gap="1.5">
                                    <Heading size="lg">{stakingAsset?.ticker} Staking #{rewardNumber}</Heading>
                                    <HStack flexWrap="wrap" gap="2">
                                        <Badge
                                            colorPalette={stakingAsset?.verified && prizeAsset?.verified ? 'green' : 'orange'}
                                            variant="subtle"
                                            size="sm"
                                        >
                                            <HStack gap="1">
                                                <LuShield size={12} />
                                                <Text>{stakingAsset?.verified && prizeAsset?.verified ? 'Verified' : 'Unverified'}</Text>
                                            </HStack>
                                        </Badge>
                                        {hasUserStake && (
                                            <Badge colorPalette={'blue'} variant="solid" size="sm">
                                                {'Active'}
                                            </Badge>
                                        )}
                                        {hasUnbonding && (
                                            <Badge colorPalette={'orange'} variant="solid" size="sm">
                                                {'Unstaking'}
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>
                            </HStack>
                            {calculatedApr !== '' &&
                                <Box display={{base: 'block', md: 'none'}} width="full">
                                    <Box
                                        bg="green.50"
                                        borderWidth="1px"
                                        borderColor="green.200"
                                        borderRadius="lg"
                                        px="4"
                                        py="3"
                                    >
                                        <HStack justify="space-between" align="center">
                                            <HStack gap="2">
                                                <LuTrendingUp size={18} color="var(--chakra-colors-green-600)" />
                                                <Text fontSize="sm" fontWeight="semibold" color="green.700">
                                                    APR
                                                </Text>
                                            </HStack>
                                            <Text fontSize="2xl" fontWeight="bold" color="green.600">
                                                {calculatedApr}
                                            </Text>
                                        </HStack>
                                    </Box>
                                </Box>
                            }
                        </VStack>
                        {calculatedApr !== '' &&
                            <Box display={{base: 'none', md: 'block'}}>
                                <Box
                                    bg="green.50"
                                    borderWidth="1px"
                                    borderColor="green.200"
                                    borderRadius="xl"
                                    px="5"
                                    py="4"
                                    minW="140px"
                                >
                                    <VStack gap="1" align="center">
                                        <HStack gap="1.5">
                                            <LuTrendingUp size={16} color="var(--chakra-colors-green-600)" />
                                            <Text fontSize="xs" fontWeight="semibold" color="green.700" textTransform="uppercase" letterSpacing="wide">
                                                APR
                                            </Text>
                                        </HStack>
                                        <Text fontSize="2xl" fontWeight="bold" color="green.600" lineHeight="1">
                                            {calculatedApr}
                                        </Text>
                                    </VStack>
                                </Box>
                            </Box>
                        }
                    </HStack>
                </Card.Header>

                <Card.Body pt="0">
                    <VStack align="stretch" gap="4">
                        {hasUserStake && (
                            <Box
                                bg="blue.50"
                                borderWidth="1px"
                                borderColor="blue.200"
                                borderRadius="lg"
                                p="4"
                            >
                                <VStack align="stretch" gap="3">
                                    <HStack justify="space-between" width="full">
                                        <Text fontSize="sm" fontWeight="semibold" color="blue.700">Your Stake</Text>
                                        <Text fontSize="lg" fontWeight="bold" color="blue.800">
                                            {yourStake}
                                        </Text>
                                    </HStack>
                                    <Separator />
                                    <HStack justify="space-between" width="full">
                                        <HStack gap="2">
                                            <LuCoins size={16} color="var(--chakra-colors-green-600)" />
                                            <Text fontSize="sm" fontWeight="semibold" color="green.700">Pending Rewards</Text>
                                        </HStack>
                                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                                            {pendingRewards}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        )}
                        {hasUnbonding && (
                            <Box
                                bg="orange.50"
                                borderWidth="1px"
                                borderColor="orange.200"
                                borderRadius="lg"
                                p="4"
                            >
                                <HStack justify="space-between" width="full">
                                    <HStack gap="2">
                                        <LuLock size={16} color="var(--chakra-colors-orange-600)" />
                                        <Text fontSize="sm" fontWeight="semibold" color="orange.700">Pending Unlock</Text>
                                    </HStack>
                                    <Text fontSize="lg" fontWeight="bold" color="orange.600">
                                        {pendingUnlock}
                                    </Text>
                                </HStack>
                            </Box>
                        )}

                        <Grid templateColumns={{base: "1fr", sm: "1fr 1fr"}} gap="3">
                            <Box
                                bg="bg.subtle"
                                borderWidth="1px"
                                borderColor="border"
                                borderRadius="lg"
                                p="3"
                            >
                                <VStack align="start" gap="2">
                                    <HStack gap="2">
                                        <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Unlock Duration</Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="lg">{stakingReward?.lock} days</Text>
                                </VStack>
                            </Box>
                            <Box
                                bg="bg.subtle"
                                borderWidth="1px"
                                borderColor="border"
                                borderRadius="lg"
                                p="3"
                            >
                                <VStack align="start" gap="2">
                                    <HStack gap="2">
                                        <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Remaining Days</Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="lg">{remainingDays} days</Text>
                                </VStack>
                            </Box>

                            <Box
                                bg="bg.subtle"
                                borderWidth="1px"
                                borderColor="border"
                                borderRadius="lg"
                                p="3"
                            >
                                <VStack align="start" gap="2">
                                    <HStack gap="2">
                                        <LuCoins size={16} color="var(--chakra-colors-gray-500)" />
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Daily Distribution</Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="lg">{dailyDistribution}</Text>
                                </VStack>
                            </Box>

                            <Box
                                bg="bg.subtle"
                                borderWidth="1px"
                                borderColor="border"
                                borderRadius="lg"
                                p="3"
                            >
                                <VStack align="start" gap="2">
                                    <HStack gap="2">
                                        <LuTrendingUp size={16} color="var(--chakra-colors-gray-500)" />
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Min. Staking</Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="lg">{minStake}</Text>
                                </VStack>
                            </Box>

                            <Box
                                bg="bg.subtle"
                                borderWidth="1px"
                                borderColor="border"
                                borderRadius="lg"
                                p="3"
                                gridColumn={{base: "1", sm: "1 / -1"}}
                            >
                                <VStack align="start" gap="2">
                                    <HStack gap="2">
                                        <LuLock size={16} color="var(--chakra-colors-gray-500)" />
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Total Staked</Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="lg">{totalStaked}</Text>
                                </VStack>
                            </Box>
                        </Grid>

                        <Separator />

                        <Box
                            bg="bg.subtle"
                            borderRadius="lg"
                            p="4"
                        >
                            <HStack justify="space-around" width="full">
                                <VStack gap="2">
                                    <Box
                                        p="2"
                                        bg="bg"
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor="border"
                                    >
                                        <TokenLogo src={stakingAsset?.logo} symbol={stakingAsset?.ticker ?? ''}/>
                                    </Box>
                                    <VStack align="center" gap="0">
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Stake</Text>
                                        <Text fontWeight="bold" fontSize="md">{stakingAsset?.ticker}</Text>
                                    </VStack>
                                </VStack>
                                <Box alignSelf="center" color="gray.400" fontSize="2xl" fontWeight="light">
                                    →
                                </Box>
                                <VStack gap="2">
                                    <Box
                                        p="2"
                                        bg="bg"
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor="border"
                                    >
                                        <TokenLogo src={prizeAsset?.logo} symbol={prizeAsset?.ticker ?? ''}/>
                                    </Box>
                                    <VStack align="center" gap="0">
                                        <Text fontSize="xs" color="gray.600" fontWeight="medium">Earn</Text>
                                        <Text fontWeight="bold" fontSize="md">{prizeAsset?.ticker}</Text>
                                    </VStack>
                                </VStack>
                            </HStack>
                        </Box>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </Skeleton>
    );
}
