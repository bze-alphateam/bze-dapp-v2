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
    pendingRewards: Balance;
}

export interface NativeUnbondingSummary {
    total: Balance;
    firstUnlock: {
        amount?: Balance;
        unlockTime?: Date;
    }
}
