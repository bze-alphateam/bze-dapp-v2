// hooks/useNavigation.ts
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo} from "react";
import {createMarketId} from "@/utils/market";

const MARKET_ID_PARAM = 'market_id'

// Basic navigation without search params (no Suspense needed)
export const useNavigation = () => {
    const router = useRouter();
    const pathname = usePathname();

    const toMarketPage = useCallback((base: string, quote: string) => {
        router.push(`/exchange/market?${MARKET_ID_PARAM}=${createMarketId(base, quote)}`)
    }, [router]);

    const toExchangePage = useCallback(() => {
        router.push('/exchange')
    }, [router]);

    return {
        currentPathName: pathname,
        navigate: router.push,
        toMarketPage,
        toExchangePage,
    };
};

// Extended version with search params (requires Suspense)
export const useNavigationWithParams = () => {
    const navigation = useNavigation();
    const searchParams = useSearchParams();

    const getQueryParam = useCallback((param: string) => {
        return searchParams.get(param)
    }, [searchParams]);

    const marketIdParam = useMemo(() => {
        return searchParams.get(MARKET_ID_PARAM)
    }, [searchParams]);

    return {
        ...navigation,
        getQueryParam,
        marketIdParam,
    };
};