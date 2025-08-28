import BigNumber from "bignumber.js";
import {useAssetsContext} from "@/hooks/useAssets";

export interface Balance {
    denom: string;
    amount: BigNumber;
}

export function useBalances() {
    const { balancesMap } = useAssetsContext()

    const getAssetBalance = (denom: string): Balance => {
        const balance = balancesMap.get(denom)
        if (!balance) {
            return {
                denom: denom,
                amount: BigNumber(0)
            }
        }

        return {
            denom: denom,
            amount: balance
        }
    }

    const balances = Array.from(balancesMap.values())

    return {
        getAssetBalance,
        balances
    }
}
