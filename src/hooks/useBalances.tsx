import BigNumber from "bignumber.js";
import {useAssetsContext} from "@/hooks/useAssets";
import {Asset} from "@/types/asset";
import {uAmountToBigNumberAmount} from "@/utils/amount";

export interface AssetBalance extends Asset {
    amount: BigNumber;
    USDValue: BigNumber;
}

export function useBalances() {
    const { balancesMap, isLoading, assetsMap, usdPricesMap } = useAssetsContext()

    const balances = Array.from(balancesMap.values())

    const getAssetsBalances = () => {
        const result: AssetBalance[] = []
        balances.map(bal => {
            const asset = assetsMap.get(bal.denom)
            if (!asset) {
                return
            }

            let usdPrice = usdPricesMap.get(bal.denom)
            if (!usdPrice) {
                usdPrice = BigNumber(0)
            }

            result.push({
                ...asset,
                amount: bal.amount,
                USDValue: uAmountToBigNumberAmount(bal.amount, asset.decimals).multipliedBy(usdPrice)
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
