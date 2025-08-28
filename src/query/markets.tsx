import {getPageRequestWithLimit, getRestClient} from "@/query/client";
import {QueryAllMarketsRequest} from "@bze/bzejs/bze/tradebin/query";

const {fromPartial: AllMarketsRequest} = QueryAllMarketsRequest;

const DEFAULT_LIMIT = 1000;

export const getMarkets = async () => {
    try {
        const client = await getRestClient();
        const resp = await client.bze.tradebin.allMarkets(AllMarketsRequest(
            {pagination: getPageRequestWithLimit(DEFAULT_LIMIT)})
        );

        return resp.market;
    } catch (error) {
        console.error('failed to get markets: ', error);
    }

    return []
}
