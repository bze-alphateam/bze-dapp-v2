import {useCallback} from "react";
import {useAssetsContext} from "@/hooks/useAssets";
import {PrettyBalance} from "@/types/balance";
import BigNumber from "bignumber.js";

export function useAssetsValue() {
    const {usdPricesMap, isLoadingPrices} = useAssetsContext()

    const totalUsdValue = useCallback((prettyBalances: PrettyBalance[]) => {
        let usdValue = BigNumber(0)
        prettyBalances.map((denomBalance: PrettyBalance) => {
            const assetPrice = usdPricesMap.get(denomBalance.denom)
            if (assetPrice && assetPrice.gt(0)) {
                usdValue = usdValue.plus(assetPrice.multipliedBy(denomBalance.amount))
            }
        })

        return usdValue
    }, [usdPricesMap])

    const compareValues = useCallback((a: PrettyBalance, b: PrettyBalance) => {
        let aValue = BigNumber(0)
        const aPrice = usdPricesMap.get(a.denom)
        if (aPrice && aPrice.gt(0)) {
            aValue = aPrice.multipliedBy(a.amount)
        }
        let bValue = BigNumber(0)
        const bPrice = usdPricesMap.get(b.denom)
        if (bPrice && bPrice.gt(0)) {
            bValue = bPrice.multipliedBy(b.amount)
        }

        return aValue.comparedTo(bValue) ?? 0
    }, [usdPricesMap])

    return {
        isLoading: isLoadingPrices,
        totalUsdValue,
        compareValues,
    }
}
