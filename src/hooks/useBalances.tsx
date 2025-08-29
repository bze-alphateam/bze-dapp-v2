import BigNumber from "bignumber.js";
import {useAssetsContext} from "@/hooks/useAssets";
import {Asset} from "@/types/asset";

export interface AssetBalance extends Asset {
    amount: BigNumber;
}

export function useBalances() {
    const { balancesMap, isLoading, assetsMap } = useAssetsContext()

    const balances = Array.from(balancesMap.values())

    const getAssetsBalances = () => {
        const result: AssetBalance[] = []
        balances.map(bal => {
            const asset = assetsMap.get(bal.denom)
            if (!asset) {
                return
            }

            result.push({
                ...asset,
                amount: bal.amount
            })
        })

        return result
    }

    return {
        isLoading,
        balances,
        getAssetsBalances
    }
}

export function useBalance(denom: string) {
    const { balancesMap, isLoading } = useAssetsContext()

    const balance = balancesMap.get(denom) || {
        denom,
        amount: BigNumber(0)
    }

    return {
        balance,
        isLoading,
    }
}
