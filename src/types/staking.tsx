import {Balance} from "@/types/balance";
import {PendingUnlockParticipantSDKType, StakingRewardParticipantSDKType} from "@bze/bzejs/bze/rewards/store";
import BigNumber from "bignumber.js";

export interface NativeStakingData {
    averageApr: string;
    unlockDuration: string;
    totalStaked: Balance;
    minAmount: Balance;
    averageDailyDistribution: Balance;
    currentStaking?: UserNativeStakingData;
}

export interface UserNativeStakingData {
    staked: Balance;
    unbonding: NativeUnbondingSummary;
    pendingRewards: UserNativeStakingRewards;
}

export interface UserNativeStakingRewards {
    total: Balance;
    validators: string[];
}

export interface NativeUnbondingSummary {
    total: Balance;
    firstUnlock: {
        amount?: Balance;
        unlockTime?: Date;
    }
}

/**
 * AddressRewardsStaking contains the rewards staking data for a specific address.
 * @property {string} address - The address for which the rewards staking data is retrieved.
 * @property {Map<string, StakingRewardParticipantSDKType>} active - A map of active rewards staking where the address
 * is currently participating in. The key is the reward_id
 * @property {Map<string, PendingUnlockParticipantSDKType>} unlocking - A map of pending unlock staking amounts. The key
 * is the reward_id.
 */
export interface AddressRewardsStaking {
    address: string;
    active: Map<string, StakingRewardParticipantSDKType>;
    unlocking: Map<string, ExtendedPendingUnlockParticipantSDKType[]>;
}

export interface ExtendedPendingUnlockParticipantSDKType extends PendingUnlockParticipantSDKType {
    unlockEpoch: BigNumber;
    rewardId: string;
}
