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
    Progress,
    Separator,
    Skeleton,
    Text,
    VStack
} from "@chakra-ui/react";
import {LuClock, LuCoins, LuLock, LuPercent, LuShield, LuTrendingUp} from "react-icons/lu";
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

    const stakingStatus = useMemo(() => {
        if (!stakingReward) {
            return 'waiting'
        }

        const hasStakers = new BigNumber(stakingReward.staked_amount).gt(0)

        // Finished: all payouts done (remaining days = 0)
        if (remainingDays === 0) {
            return 'finished'
        }

        // Active: has stakers and still has days remaining
        if (hasStakers && remainingDays > 0) {
            return 'active'
        }

        // Waiting: has days remaining but no stakers yet
        return 'waiting'
    }, [stakingReward, remainingDays])

    const areAssetsVerified = useMemo(() => {
        return stakingAsset?.verified && prizeAsset?.verified
    }, [stakingAsset, prizeAsset])

    const progressPercentage = useMemo(() => {
        if (!stakingReward || stakingReward.duration === 0) {
            return 0
        }
        return (stakingReward.payouts / stakingReward.duration) * 100
    }, [stakingReward])

    const userStakePercentage = useMemo(() => {
        if (!userStake || !stakingReward) {
            return new BigNumber(0)
        }
        const userAmount = new BigNumber(userStake.amount)
        const totalStaked = new BigNumber(stakingReward.staked_amount)

        if (totalStaked.isZero()) {
            return new BigNumber(0)
        }

        return userAmount.dividedBy(totalStaked).multipliedBy(100)
    }, [userStake, stakingReward])

    const userDailyReward = useMemo(() => {
        if (!userStake || !stakingReward || userStakePercentage.isZero()) {
            return ""
        }

        const dailyAmount = uAmountToBigNumberAmount(stakingReward.prize_amount, prizeAsset?.decimals || 0)
        const userShare = dailyAmount.multipliedBy(userStakePercentage).dividedBy(100)

        return `${shortNumberFormat(userShare)} ${prizeAsset?.ticker}`
    }, [userStake, stakingReward, userStakePercentage, prizeAsset])

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
                <Card.Header pb="3">
                    <HStack justify="space-between" align="start" gap="4">
                        <VStack align="start" gap="2" flex="1">
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
                                <VStack align="start" gap="1">
                                    <Heading size="md">{stakingAsset?.ticker} Staking #{rewardNumber}</Heading>
                                    <HStack flexWrap="wrap" gap="1.5" fontSize="xs">
                                        <Badge
                                            colorPalette={
                                                stakingStatus === 'active' ? 'green' :
                                                stakingStatus === 'finished' ? 'blue' :
                                                'gray'
                                            }
                                            variant="subtle"
                                            size="sm"
                                        >
                                            {stakingStatus === 'active' ? 'Rolling Rewards' :
                                             stakingStatus === 'finished' ? 'Completed' :
                                             'Waiting Stakers'}
                                        </Badge>
                                        {areAssetsVerified && (
                                            <Badge colorPalette="green" variant="outline" size="sm">
                                                <HStack gap="1">
                                                    <LuShield size={10} />
                                                    <Text>Verified</Text>
                                                </HStack>
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>
                            </HStack>
                            {calculatedApr !== '' &&
                                <Box display={{base: 'block', md: 'none'}} width="full">
                                    <Box
                                        bgGradient="to-r"
                                        gradientFrom="green.500/10"
                                        gradientTo="green.600/10"
                                        borderWidth="1px"
                                        borderColor="green.500/30"
                                        borderRadius="lg"
                                        px="3"
                                        py="2"
                                    >
                                        <HStack justify="space-between" align="center">
                                            <HStack gap="1.5">
                                                <LuTrendingUp size={16} />
                                                <Text fontSize="xs" fontWeight="semibold">
                                                    APR
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xl" fontWeight="bold" color="green.600">
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
                                    bgGradient="to-br"
                                    gradientFrom="green.500/10"
                                    gradientTo="green.600/10"
                                    borderWidth="1px"
                                    borderColor="green.500/30"
                                    borderRadius="lg"
                                    px="4"
                                    py="3"
                                    minW="120px"
                                >
                                    <VStack gap="0.5" align="center">
                                        <HStack gap="1">
                                            <LuTrendingUp size={14} />
                                            <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                                                APR
                                            </Text>
                                        </HStack>
                                        <Text fontSize="xl" fontWeight="bold" color="green.600" lineHeight="1">
                                            {calculatedApr}
                                        </Text>
                                    </VStack>
                                </Box>
                            </Box>
                        }
                    </HStack>
                </Card.Header>

                <Card.Body pt="0">
                    <VStack align="stretch" gap="3">
                        {/* User Stake Info */}
                        {hasUserStake && (
                            <Box
                                bgGradient="to-r"
                                gradientFrom="blue.500/10"
                                gradientTo="blue.600/10"
                                borderWidth="1px"
                                borderColor="blue.500/30"
                                borderRadius="lg"
                                p="3"
                            >
                                <VStack align="stretch" gap="2">
                                    <HStack justify="space-between" width="full">
                                        <HStack gap="1.5">
                                            <LuPercent size={14} />
                                            <Text fontSize="xs" fontWeight="medium">Your Stake</Text>
                                        </HStack>
                                        <HStack gap="2">
                                            <Text fontSize="md" fontWeight="bold">
                                                {yourStake}
                                            </Text>
                                            <Badge colorPalette="blue" variant="subtle" size="sm">
                                                {userStakePercentage.toFixed(2)}%
                                            </Badge>
                                        </HStack>
                                    </HStack>
                                    <Separator />
                                    <HStack justify="space-between" width="full">
                                        <HStack gap="1.5">
                                            <LuCoins size={14} />
                                            <Text fontSize="xs" fontWeight="medium">Pending Rewards</Text>
                                        </HStack>
                                        <Text fontSize="md" fontWeight="bold" color="green.600">
                                            {pendingRewards}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>
                        )}
                        {hasUnbonding && (
                            <Box
                                bgGradient="to-r"
                                gradientFrom="orange.500/10"
                                gradientTo="orange.600/10"
                                borderWidth="1px"
                                borderColor="orange.500/30"
                                borderRadius="lg"
                                p="3"
                            >
                                <HStack justify="space-between" width="full">
                                    <HStack gap="1.5">
                                        <LuLock size={14} />
                                        <Text fontSize="xs" fontWeight="medium">Pending Unlock</Text>
                                    </HStack>
                                    <Text fontSize="md" fontWeight="bold">
                                        {pendingUnlock}
                                    </Text>
                                </HStack>
                            </Box>
                        )}

                        {/* Compact Stats Grid */}
                        <VStack align="stretch" gap="2" fontSize="sm">
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuClock size={14} />
                                    <Text fontSize="xs">Unlock Duration</Text>
                                </HStack>
                                <Text fontWeight="semibold">{stakingReward?.lock} days</Text>
                            </HStack>
                            <Separator />
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuCoins size={14} />
                                    <Text fontSize="xs">Daily Distribution</Text>
                                </HStack>
                                <VStack align="end" gap="0.5">
                                    <Text fontWeight="semibold">{dailyDistribution}</Text>
                                    {hasUserStake && userDailyReward && (
                                        <Text fontSize="2xs" color="green.600" fontWeight="medium">
                                            You earn: {userDailyReward}
                                        </Text>
                                    )}
                                </VStack>
                            </HStack>
                            <Separator />
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuTrendingUp size={14} />
                                    <Text fontSize="xs">Min. Staking</Text>
                                </HStack>
                                <Text fontWeight="semibold">{minStake}</Text>
                            </HStack>
                            <Separator />
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuLock size={14} />
                                    <Text fontSize="xs">Total Staked</Text>
                                </HStack>
                                <Text fontWeight="semibold">{totalStaked}</Text>
                            </HStack>
                            <Separator />
                            {/* Remaining Days Progress */}
                            <VStack align="stretch" gap="1.5" py="1">
                                <HStack justify="space-between">
                                    <HStack gap="2" color="fg.muted">
                                        <LuClock size={14} />
                                        <Text fontSize="xs">Remaining Days</Text>
                                    </HStack>
                                    <Text fontSize="xs" fontWeight="semibold">
                                        {remainingDays} / {stakingReward?.duration}
                                    </Text>
                                </HStack>
                                <Progress.Root
                                    value={progressPercentage}
                                    size="xs"
                                    colorPalette="gray"
                                >
                                    <Progress.Track>
                                        <Progress.Range />
                                    </Progress.Track>
                                </Progress.Root>
                            </VStack>
                        </VStack>

                        <Separator />

                        {/* Stake -> Earn */}
                        <HStack justify="space-between" px="2">
                            <HStack gap="2">
                                <Box
                                    p="1.5"
                                    bg="bg.subtle"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="border"
                                >
                                    <TokenLogo src={stakingAsset?.logo} symbol={stakingAsset?.ticker ?? ''} size="5"/>
                                </Box>
                                <VStack align="start" gap="0">
                                    <Text fontSize="2xs" color="fg.muted">Stake</Text>
                                    <Text fontWeight="bold" fontSize="sm">{stakingAsset?.ticker}</Text>
                                </VStack>
                            </HStack>
                            <Box color="fg.muted" fontSize="lg">→</Box>
                            <HStack gap="2">
                                <Box
                                    p="1.5"
                                    bg="bg.subtle"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="border"
                                >
                                    <TokenLogo src={prizeAsset?.logo} symbol={prizeAsset?.ticker ?? ''} size="5"/>
                                </Box>
                                <VStack align="start" gap="0">
                                    <Text fontSize="2xs" color="fg.muted">Earn</Text>
                                    <Text fontWeight="bold" fontSize="sm">{prizeAsset?.ticker}</Text>
                                </VStack>
                            </HStack>
                        </HStack>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </Skeleton>
    );
}
