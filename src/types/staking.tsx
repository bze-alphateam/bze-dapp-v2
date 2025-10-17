import {Balance} from "@/types/balance";

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
