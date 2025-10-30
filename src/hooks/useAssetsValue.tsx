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

    return {
        isLoading: isLoadingPrices,
        totalUsdValue,
    }
}
