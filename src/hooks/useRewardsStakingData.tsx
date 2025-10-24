"use client";

import {useCallback, useEffect, useState} from "react";
import {getAddressStakingRewards, getStakingRewards} from "@/query/rewards";
import {StakingRewardSDKType} from "@bze/bzejs/bze/rewards/store";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {AddressRewardsStaking} from "@/types/staking";

export function useRewardsStakingData() {
    const [isLoading, setIsLoading] = useState(true)
    const [rewards, setRewards] = useState<StakingRewardSDKType[]>([])
    const [addressData, setAddressData] = useState<AddressRewardsStaking|undefined>()

    const {address} = useChain(getChainName())

    const fetchStakingRewards = useCallback(async () => {
        const all = await getStakingRewards();
        const sorted = all.list.sort((a: StakingRewardSDKType) => a.payouts >= a.duration ? 1 : -1);
        setRewards(sorted);
    }, [])

    const fetchAddressRewardsStaking = useCallback(async () => {
        setAddressData(await getAddressStakingRewards(address ?? ''))
    }, [address])

    const load = useCallback(async () => {
        await Promise.all([
            fetchStakingRewards(),
            fetchAddressRewardsStaking(),
        ])

        setIsLoading(false)
    }, [fetchStakingRewards, fetchAddressRewardsStaking])

    useEffect(() => {
        load();
    }, [load])

    return {
        isLoading,
        rewards,
        reload: load,
        addressData,
    }
}
