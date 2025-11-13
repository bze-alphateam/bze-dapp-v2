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
                _hover={{ bg: "bg.muted" }}
                onClick={onBoxClick}
            >
                <Card.Header>
                    <HStack justify="space-between" align="start">
                        <VStack align="start" gap="2">
                            <HStack>
                                <TokenLogo src={stakingAsset?.logo} symbol={stakingAsset?.ticker ?? ''}/>
                                <VStack align="start" gap="1">
                                    <Heading size="md">{stakingAsset?.ticker} Staking Reward #{rewardNumber}</Heading>
                                    <HStack>
                                        <Badge colorPalette={stakingAsset?.verified && prizeAsset?.verified ? 'green' : 'orange'} variant="subtle">
                                            <HStack gap="1">
                                                <LuShield size={12} />
                                                <Text>{stakingAsset?.verified && prizeAsset?.verified ? 'Verified' : 'Unverified'}</Text>
                                            </HStack>
                                        </Badge>
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
                                    {calculatedApr !== '' &&
                                        <Box display={{base: 'block', md: 'none'}}>
                                            <HStack gap="2">
                                                <Text fontSize="2xs" color="green.500">
                                                    APR
                                                </Text>
                                                <Text fontSize={{sm: 'lg', md: "xl"}} fontWeight="bold" color="green.500">
                                                    {calculatedApr}
                                                </Text>
                                            </HStack>
                                        </Box>
                                    }
                                </VStack>
                            </HStack>
                        </VStack>
                        {calculatedApr !== '' &&
                            <Box display={{base: 'none', md: 'block'}}>
                                <HStack gap="2">
                                    <Text fontSize="2xs" color="green.500">
                                        APR
                                    </Text>
                                    <Text fontSize={{sm: 'lg', md: "xl"}} fontWeight="bold" color="green.500">
                                        {calculatedApr}
                                    </Text>
                                </HStack>
                            </Box>
                        }
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
                                </VStack>
                            </Alert.Root>
                        )}

                        <Grid templateColumns="1fr 1fr" gap="4">
                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Unlock Duration</Text>
                                </HStack>
                                <Text fontWeight="medium">{stakingReward?.lock} days</Text>
                            </VStack>
                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuClock size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Remaining days</Text>
                                </HStack>
                                <Text fontWeight="medium">{remainingDays} days</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuCoins size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Daily Distribution</Text>
                                </HStack>
                                <Text fontWeight="medium">{dailyDistribution}</Text>
                            </VStack>

                            <VStack align="start" gap="2">
                                <HStack>
                                    <LuTrendingUp size={16} color="var(--chakra-colors-gray-500)" />
                                    <Text fontSize="sm" color="gray.600">Min. Staking</Text>
                                </HStack>
                                <Text fontWeight="medium">{minStake}</Text>
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
                                <TokenLogo src={stakingAsset?.logo} symbol={stakingAsset?.ticker ?? ''}/>
                                <VStack align="start" gap="0">
                                    <Text fontSize="sm" color="gray.600">Stake</Text>
                                    <Text fontWeight="medium">{stakingAsset?.ticker}</Text>
                                </VStack>
                            </HStack>
                            <HStack>
                                <TokenLogo src={prizeAsset?.logo} symbol={prizeAsset?.ticker ?? ''}/>
                                <VStack align="start" gap="0">
                                    <Text fontSize="sm" color="gray.600">Earn</Text>
                                    <Text fontWeight="medium">{prizeAsset?.ticker}</Text>
                                </VStack>
                            </HStack>
                        </HStack>
                    </VStack>
                </Card.Body>
            </Card.Root>
        </Skeleton>
    );
}
