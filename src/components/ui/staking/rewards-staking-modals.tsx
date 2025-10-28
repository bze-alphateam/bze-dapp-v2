import {Alert, Box, Button, Card, Heading, HStack, Input, Skeleton, Stack, Text, VStack} from "@chakra-ui/react";
import {LuGift, LuLock, LuLockOpen} from "react-icons/lu";
import React, {useMemo, useState} from "react";
import {StakingRewardParticipantSDKType, StakingRewardSDKType} from "@bze/bzejs/bze/rewards/store";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {shortNumberFormat} from "@/utils/formatter";
import {amountToBigNumberUAmount, prettyAmount, uAmountToAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {calculateRewardsStakingPendingRewards} from "@/utils/staking";
import {removeLeadingZeros} from "@/utils/strings";
import {ExtendedPendingUnlockParticipantSDKType} from "@/types/staking";
import {useBalance} from "@/hooks/useBalances";
import {sanitizeNumberInput} from "@/utils/number";
import BigNumber from "bignumber.js";

const MODAL_TYPE_ACTIONS = 'actions';
const MODAL_TYPE_STAKE = 'stake';
const MODAL_TYPE_UNSTAKE = 'unstake';
const MODAL_TYPE_CLAIM = 'claim';

interface RewardsStakingActionModalProps {
    onClose: () => void;
    stakingReward?: StakingRewardSDKType;
    userStake?: StakingRewardParticipantSDKType;
    userUnlocking?: ExtendedPendingUnlockParticipantSDKType;
}

export const RewardsStakingActionModal = ({onClose, stakingReward, userStake, userUnlocking}: RewardsStakingActionModalProps) => {
    const [modalType, setModalType] = useState(MODAL_TYPE_ACTIONS);
    const [stakeAmount, setStakeAmount] = useState('');

    const {asset: stakingAsset, isLoading: stakingAssetIsLoading} = useAsset(stakingReward?.staking_denom ?? '')
    const {asset: prizeAsset, isLoading: prizeAssetIsLoading} = useAsset(stakingReward?.prize_denom ?? '')
    const {denomTicker, isLoading: isLoadingAssets} = useAssets()
    const {balance: stakingAssetBalance} = useBalance(stakingReward?.staking_denom ?? '')

    const actionsModalTitle = useMemo(() => {
        if (!stakingReward) return 'Actions';

        return `Stake ${denomTicker(stakingReward.staking_denom)} and earn ${denomTicker(stakingReward.prize_denom)}`
    }, [denomTicker, stakingReward])

    const onCloseClick = () => {
        setModalType(MODAL_TYPE_ACTIONS);
        setStakeAmount('');
        onClose();
    }

    const openModal = (type: string) => {
        setModalType(type);
    };

    const prettyMinStake = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingReward?.min_stake, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [stakingReward, stakingAsset])

    const hasUserStake = useMemo(() => !!userStake, [userStake])
    const hasPendingRewards = useMemo(() => {
        const rewardsToClaim = calculateRewardsStakingPendingRewards(stakingReward, userStake)

        return rewardsToClaim.gt(0)
    }, [stakingReward, userStake])
    const hasUnbonding = useMemo(() => !!userUnlocking, [userUnlocking])

    const inputEstimatedRewards = useMemo(() => {
        if (!stakingReward || !stakeAmount || !stakingAsset) return '0';

        // (daily reward/(total staked + input)) * input
        //the input the user provides is an AMOUNT, not a UAmount, so we need to convert it to a UAmount
        const stakedUAmount = amountToBigNumberUAmount(stakeAmount, stakingAsset.decimals)
        const incomePerStakedCoin = new BigNumber(stakingReward.prize_amount).dividedBy(new BigNumber(stakingReward.staked_amount).plus(stakedUAmount))
        const dailyReward = incomePerStakedCoin.multipliedBy(stakedUAmount)

        return `${shortNumberFormat(uAmountToBigNumberAmount(dailyReward.integerValue(), prizeAsset?.decimals || 0))} ${prizeAsset?.ticker}`
    }, [stakingReward, prizeAsset, stakeAmount, stakingAsset])

    const yourStake = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(userStake?.amount, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [userStake, stakingAsset])

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

    const unstakeModalTitle = useMemo(() => {
        if (!stakingReward || !denomTicker) return 'Unstake Tokens';

        return `Unstake your ${denomTicker(stakingReward.staking_denom)}`
    }, [stakingReward, denomTicker])

    const claimModalTitle = useMemo(() => {
        if (!stakingReward || !denomTicker) return 'Claim Tokens';

        return `Claim your ${denomTicker(stakingReward.prize_denom)} rewards`
    }, [stakingReward, denomTicker])

    const pendingUnlock = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(userUnlocking?.amount, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [userUnlocking, stakingAsset])

    const userStakingAssetBalance = useMemo(() => {
        if (!stakingAssetBalance || !stakingAsset) return '0';

        return `${prettyAmount(uAmountToAmount(stakingAssetBalance?.amount, stakingAsset?.decimals || 0))} ${stakingAsset?.ticker}`
    }, [stakingAssetBalance, stakingAsset])

    return (
        <Skeleton asChild loading={stakingAssetIsLoading || prizeAssetIsLoading || isLoadingAssets}>
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
                                {modalType === MODAL_TYPE_STAKE && actionsModalTitle}
                                {modalType === MODAL_TYPE_UNSTAKE && unstakeModalTitle}
                                {modalType === MODAL_TYPE_CLAIM && claimModalTitle}
                                {modalType === MODAL_TYPE_ACTIONS && actionsModalTitle}
                                {' #' + rewardNumber}
                            </Heading>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCloseClick}
                            >
                                ✕
                            </Button>
                        </HStack>
                    </Card.Header>

                    <Card.Body>
                        {modalType === MODAL_TYPE_ACTIONS && stakingReward && (
                            <VStack gap="4">
                                <Text color="gray.600">{'Stake your tokens and receive daily rewards.'}</Text>
                                <Alert.Root status={"info"} variant="subtle">
                                    <Alert.Indicator />
                                    <VStack align="start" gap="2" flex="1">
                                        {hasUserStake && (
                                            <HStack justify="space-between" width="full">
                                                <Text fontWeight="medium">Stake:</Text>
                                                <VStack gap="0">
                                                    <Text fontWeight="bold">{yourStake}</Text>
                                                </VStack>
                                            </HStack>
                                        )}
                                        <HStack justify="space-between" width="full">
                                            <Text fontWeight="medium">Balance:</Text>
                                            <VStack gap="0">
                                                <Text fontWeight="bold">{userStakingAssetBalance}</Text>
                                            </VStack>
                                        </HStack>
                                        {hasUserStake && (
                                            <HStack justify="space-between" width="full">
                                                <Text fontWeight="medium">Pending Rewards:</Text>
                                                <Text fontWeight="bold" color="green.600">
                                                    {pendingRewards}
                                                </Text>
                                            </HStack>
                                        )}
                                    </VStack>
                                </Alert.Root>
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
                                <Stack direction={{ base: 'column', sm: 'row' }} width="full" gap="3">
                                    <Button
                                        flex="1"
                                        colorPalette="blue"
                                        onClick={() => openModal('stake')}
                                        disabled={stakingAssetBalance.amount.isZero()}
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
                                        onClick={() => openModal('unstake')}
                                    >
                                        <HStack gap="2">
                                            <LuLockOpen size={16} />
                                            <Text>Unstake</Text>
                                        </HStack>
                                    </Button>

                                    <Button
                                        flex="1"
                                        colorPalette="green"
                                        disabled={!hasPendingRewards}
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

                        {modalType === MODAL_TYPE_STAKE && stakingReward && (
                            <VStack gap="4">
                                <Text>Enter the amount you want to stake:</Text>
                                <Input
                                    placeholder={`Min: ${prettyMinStake}`}
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(sanitizeNumberInput(e.target.value))}
                                    type="text"
                                />

                                {stakeAmount && (
                                    <Alert.Root status="success" variant="subtle">
                                        <Alert.Indicator />
                                        <VStack align="start" gap="2" flex="1">
                                            <Alert.Title>Estimated Daily Rewards:</Alert.Title>
                                            <Text fontSize="lg" fontWeight="bold" color="green.600">
                                                {inputEstimatedRewards}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                Lock period: {stakingReward?.lock || 0} days
                                            </Text>
                                        </VStack>
                                    </Alert.Root>
                                )}

                                <Button colorPalette="blue" width="full" disabled={!stakeAmount}>
                                    Confirm Stake
                                </Button>
                            </VStack>
                        )}

                        {modalType === MODAL_TYPE_UNSTAKE && userStake && (
                            <VStack gap="4">
                                <Alert.Root status="warning" variant="subtle">
                                    <Alert.Indicator />
                                    <VStack align="start" gap="1" flex="1">
                                        <Alert.Title>Unstaking Notice</Alert.Title>
                                        <Alert.Description>
                                            Your funds will be locked for {stakingReward?.lock || 0} days. You will receive them after the lock period ends.
                                        </Alert.Description>
                                    </VStack>
                                </Alert.Root>

                                <Text>Amount to unstake: {yourStake}</Text>

                                <Button colorPalette="red" width="full">
                                    Confirm Unstake
                                </Button>
                            </VStack>
                        )}

                        {modalType === MODAL_TYPE_CLAIM && userStake && (
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
        </Skeleton>
    )
}
