import {Box, HStack, Text, VStack} from "@chakra-ui/react";
import React, {useMemo} from "react";
import {prettyAmount, uAmountToAmount} from "@/utils/amount";
import {useEpochs} from "@/hooks/useEpochs";
import {ExtendedPendingUnlockParticipantSDKType} from "@/types/staking";
import {LuLockOpen} from "react-icons/lu";


export const RewardsStakingUnlockAlerts = ({userUnlocking, ticker, decimals}: {userUnlocking?: ExtendedPendingUnlockParticipantSDKType[], ticker: string, decimals: number}) => {
    const {getHourEpochInfo} = useEpochs()

    const pendingUnlock = useMemo(() => {
        if (!userUnlocking) return [];

        const currentHour = getHourEpochInfo()
        if (!currentHour) return []

        const result = [];
        for (const unlock of userUnlocking) {
            const remainingHours = unlock.unlockEpoch.minus(currentHour.current_epoch)
            const days = Math.floor(remainingHours.dividedBy(24).toNumber())
            const unlockAmount = prettyAmount(uAmountToAmount(unlock?.amount, decimals))
            const item = {
                amount: unlockAmount,
                title: `${unlockAmount} ${ticker} unlocking in 1 hour`
            };
            if (days >= 2) {
                item.title = `${unlockAmount} ${ticker} unlocking in ${days} days`;
            } else if (remainingHours.gt(1)) {
                item.title = `${unlockAmount} ${ticker} unlocking in ${remainingHours.toNumber()} hours`;
            }

            result.push(item)
        }

        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userUnlocking, decimals, ticker])

    return (
        <>
            {pendingUnlock.length > 0 && pendingUnlock.map((item, index) => (
                <Box
                    key={index}
                    bgGradient="to-br"
                    gradientFrom="orange.500/15"
                    gradientTo="orange.600/15"
                    borderWidth="1px"
                    borderColor="orange.500/30"
                    borderRadius="md"
                    p="3"
                    w='full'
                >
                    <VStack align="start" gap="0.5">
                        <HStack gap="1" color="orange.600">
                            <LuLockOpen size={12} />
                            <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase">Pending Unlock</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg">{item.title}</Text>
                    </VStack>
                </Box>
            ))}
        </>
    )
}
