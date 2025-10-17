"use client";

import {useCallback, useEffect, useState} from "react";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {NativeStakingData} from "@/types/staking";
import {
    getAddressNativeDelegatedBalance,
    getAddressNativeTotalRewards, getAddressUnbondingDelegationsSummary,
    getAnnualProvisions,
    getDistributionParams,
    getStakingParams,
    getStakingPool
} from "@/query/staking";
import {calcNativeStakingApr, parseUnbondingDays} from "@/utils/staking";
import BigNumber from "bignumber.js";
import {useAssets} from "@/hooks/useAssets";

export function useNativeStakingData() {
    const [isLoading, setIsLoading] = useState(true)
    const [stakingData, setStakingData] = useState<NativeStakingData|undefined>()
    const {address} = useChain(getChainName())
    const {nativeAsset, isLoading: isLoadingAssets} = useAssets()

    const load = useCallback(async () => {
        if (isLoadingAssets || !nativeAsset) {
            return;
        }

        try {
            const [
                annualProvisions,
                distrParams,
                stakingPool,
                stakingParams,
            ] = await Promise.all([
                getAnnualProvisions(),
                getDistributionParams(),
                getStakingPool(),
                getStakingParams(),
            ])

            const apr = calcNativeStakingApr(stakingPool, distrParams.community_tax, annualProvisions)
            const data: NativeStakingData = {
                averageApr: apr,
                unlockDuration: parseUnbondingDays(stakingParams.unbonding_time as string),
                totalStaked: {
                    amount: new BigNumber(stakingPool.bonded_tokens),
                    denom: nativeAsset.denom
                },
                minAmount: {
                    amount: new BigNumber(0),
                    denom: nativeAsset.denom
                },
                averageDailyDistribution: {
                    amount: annualProvisions.dividedBy(365),
                    denom: nativeAsset.denom
                },
            }

            if (address) {
                const [
                    delegations,
                    totalRewards,
                    unbonding
                ] = await Promise.all([
                    getAddressNativeDelegatedBalance(address),
                    getAddressNativeTotalRewards(address),
                    getAddressUnbondingDelegationsSummary(address)
                ])

                data.currentStaking = {
                    staked: delegations,
                    unbonding: unbonding,
                    pendingRewards: totalRewards,
                }
            }

            setStakingData(data)
        } catch (error) {
            console.error("Failed to load staking data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [isLoadingAssets, nativeAsset, address])

    // Initial load when assets are ready
    useEffect(() => {
        if (!isLoadingAssets && nativeAsset) {
            load()
        }
    }, [isLoadingAssets, nativeAsset, load])

    return {
        isLoading,
        reload: load,
        stakingData,
    }
}
