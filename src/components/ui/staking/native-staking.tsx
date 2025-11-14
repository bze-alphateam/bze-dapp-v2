import {
    Badge,
    Box, Button,
    Card,
    Heading,
    HStack,
    Separator,
    Skeleton, Stack,
    Text,
    VStack
} from "@chakra-ui/react";
import {LuClock, LuCoins, LuGift, LuInfinity, LuLock, LuLockOpen, LuShield, LuTrendingUp} from "react-icons/lu";
import React, {useMemo, useState} from "react";
import {NativeStakingData} from "@/types/staking";
import {useAssets} from "@/hooks/useAssets";
import {prettyAmount, uAmountToAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {shortNumberFormat} from "@/utils/formatter";
import {openExternalLink} from "@/utils/functions";
import {useToast} from "@/hooks/useToast";
import {cosmos} from "@bze/bzejs";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {useSDKTx} from "@/hooks/useTx";
import {TokenLogo} from "@/components/ui/token_logo";

interface NativeStakingCardProps {
    stakingData: NativeStakingData|undefined;
    isLoading: boolean;
    onClaimSuccess?: () => void;
}

const MIN_CLAIM_AMOUNT = 100_000;

export const NativeStakingCard = ({ stakingData, isLoading, onClaimSuccess }: NativeStakingCardProps) => {
    const [modalType, setModalType] = useState('');
    const [pendingClaim, setPendingClaim] = useState(false);

    const hasUserStake = !!stakingData?.currentStaking?.staked.amount.gt(0);
    const hasUnbonding = !!stakingData?.currentStaking?.unbonding.total.amount.gt(0);
    const hasRewards = !!stakingData?.currentStaking?.pendingRewards.total.amount.gt(MIN_CLAIM_AMOUNT);

    const {nativeAsset} = useAssets()
    const {toast} = useToast()
    const {address} = useChain(getChainName())
    const {tx} = useSDKTx(getChainName())

    const yourStake = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData?.currentStaking?.staked.amount, nativeAsset?.decimals || 0))} ${nativeAsset?.ticker}`
    }, [stakingData?.currentStaking?.staked.amount, nativeAsset])

    const pendingRewards = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData?.currentStaking?.pendingRewards.total.amount, nativeAsset?.decimals || 0))} ${nativeAsset?.ticker}`
    }, [stakingData?.currentStaking?.pendingRewards.total.amount, nativeAsset])

    const pendingUnlock = useMemo(() => {
        return `${prettyAmount(uAmountToAmount(stakingData?.currentStaking?.unbonding.total.amount, nativeAsset?.decimals || 0))} ${nativeAsset?.ticker}`
    }, [stakingData?.currentStaking?.unbonding.total.amount, nativeAsset])

    const pendingUnlockAlert = useMemo(() => {
        const firstUnlockAmount = prettyAmount(uAmountToAmount(stakingData?.currentStaking?.unbonding.firstUnlock.amount?.amount, nativeAsset?.decimals || 0))

        return `${firstUnlockAmount} ${nativeAsset?.ticker} will be unlocked on ${stakingData?.currentStaking?.unbonding.firstUnlock.unlockTime?.toLocaleDateString()} at ${stakingData?.currentStaking?.unbonding.firstUnlock.unlockTime?.toLocaleTimeString()}`
    }, [stakingData?.currentStaking, nativeAsset])

    const dailyDistribution = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingData?.averageDailyDistribution.amount, nativeAsset?.decimals || 0))} ${nativeAsset?.ticker}`
    }, [stakingData?.averageDailyDistribution.amount, nativeAsset])

    const totalStaked = useMemo(() => {
        return `${shortNumberFormat(uAmountToBigNumberAmount(stakingData?.totalStaked.amount, nativeAsset?.decimals || 0))} ${nativeAsset?.ticker}`
    }, [stakingData?.totalStaked.amount, nativeAsset])

    const openModal = (type: string) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType('');
    };

    const onClaimRewards = async () => {
        if (!hasRewards || !stakingData?.currentStaking?.pendingRewards.validators || !address) {
            toast.error('Error', `Rewards amount is too low to claim. Minimum amount is ${uAmountToAmount(MIN_CLAIM_AMOUNT, nativeAsset?.decimals || 6)} ${nativeAsset?.ticker}.`)
            return
        }

        setPendingClaim(true)
        const { withdrawDelegatorReward } = cosmos.distribution.v1beta1.MessageComposer.fromPartial;
        const msgs = stakingData.currentStaking.pendingRewards.validators.map(validator => {
            return withdrawDelegatorReward({
                delegatorAddress: address,
                validatorAddress: validator,
            })
        })

        await tx(msgs);

        setPendingClaim(false)
        closeModal()
        if (onClaimSuccess) {
            onClaimSuccess()
        }
    }

    return (
        <>
            <Skeleton asChild loading={isLoading}>
            <Card.Root
                borderWidth={hasUserStake ? "2px" : "1px"}
                borderColor={hasUserStake ? "blue.500" : (hasUnbonding ? "orange.500" : "purple.500")}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                    bg: "bg.muted",
                    transform: "translateY(-2px)",
                    shadow: "lg"
                }}
                onClick={() => openModal('actions')}
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
                                    <TokenLogo src={'/images/bze_alternative_512x512.png'} symbol={nativeAsset?.ticker ?? ''}/>
                                </Box>
                                <VStack align="start" gap="1">
                                    <Heading size="md">BZE Native Staking</Heading>
                                    <HStack flexWrap="wrap" gap="1.5" fontSize="xs">
                                        <Badge
                                            colorPalette="purple"
                                            variant="solid"
                                            size="sm"
                                        >
                                            Native
                                        </Badge>
                                        <Badge colorPalette="green" variant="outline" size="sm">
                                            <HStack gap="1">
                                                <LuShield size={10} />
                                                <Text>Verified</Text>
                                            </HStack>
                                        </Badge>
                                    </HStack>
                                </VStack>
                            </HStack>
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
                                            ≈{stakingData?.averageApr}%
                                        </Text>
                                    </HStack>
                                </Box>
                            </Box>
                        </VStack>
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
                                        ≈{stakingData?.averageApr}%
                                    </Text>
                                </VStack>
                            </Box>
                        </Box>
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
                                        <Text fontSize="xs" fontWeight="medium">Your Stake</Text>
                                        <Text fontSize="md" fontWeight="bold">
                                            {yourStake}
                                        </Text>
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
                                <VStack align="stretch" gap="2">
                                    <HStack justify="space-between" width="full">
                                        <HStack gap="1.5">
                                            <LuLock size={14} />
                                            <Text fontSize="xs" fontWeight="medium">Pending Unlock</Text>
                                        </HStack>
                                        <Text fontSize="md" fontWeight="bold">
                                            {pendingUnlock}
                                        </Text>
                                    </HStack>
                                    <Text fontSize="2xs" color="fg.muted">
                                        {pendingUnlockAlert}
                                    </Text>
                                </VStack>
                            </Box>
                        )}

                        {/* Compact Stats List */}
                        <VStack align="stretch" gap="2" fontSize="sm">
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuClock size={14} />
                                    <Text fontSize="xs">Unlock Duration</Text>
                                </HStack>
                                <Text fontWeight="semibold">{stakingData?.unlockDuration} days</Text>
                            </HStack>
                            <Separator />
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuCoins size={14} />
                                    <Text fontSize="xs">Daily Distribution</Text>
                                </HStack>
                                <Text fontWeight="semibold">≈{dailyDistribution}</Text>
                            </HStack>
                            <Separator />
                            <HStack justify="space-between" py="1">
                                <HStack gap="2" color="fg.muted">
                                    <LuTrendingUp size={14} />
                                    <Text fontSize="xs">Min. Staking</Text>
                                </HStack>
                                <Text fontWeight="semibold">No minimum</Text>
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
                            {/* Perpetual Rewards Message */}
                            <Box
                                bgGradient="to-r"
                                gradientFrom="purple.500/10"
                                gradientTo="purple.600/10"
                                borderWidth="1px"
                                borderColor="purple.500/30"
                                borderRadius="lg"
                                p="3"
                                mt="1"
                            >
                                <HStack justify="center" gap="2">
                                    <LuInfinity size={16} />
                                    <Text fontSize="xs" fontWeight="medium" textAlign="center">
                                        Rolling rewards for years ahead
                                    </Text>
                                </HStack>
                            </Box>
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
                                    <TokenLogo src={'/images/bze_alternative_512x512.png'} symbol={nativeAsset?.ticker ?? ''} size="5"/>
                                </Box>
                                <VStack align="start" gap="0">
                                    <Text fontSize="2xs" color="fg.muted">Stake</Text>
                                    <Text fontWeight="bold" fontSize="sm">{nativeAsset?.ticker}</Text>
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
                                    <TokenLogo src={'/images/bze_alternative_512x512.png'} symbol={nativeAsset?.ticker ?? ''} size="5"/>
                                </Box>
                                <VStack align="start" gap="0">
                                    <Text fontSize="2xs" color="fg.muted">Earn</Text>
                                    <Text fontWeight="bold" fontSize="sm">{nativeAsset?.ticker}</Text>
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
                                    <Text color="gray.600">{'Secure the BeeZee network and earn rewards by staking your BZE coins.'}</Text>

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
                                    <Button colorPalette="green" width="full" loading={pendingClaim} loadingText={"Claiming rewards..."} onClick={onClaimRewards}>
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
