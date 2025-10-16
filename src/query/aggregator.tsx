import {MarketData} from "@/types/market";
import {getAggregatorHost} from "@/constants/endpoints";
import {HistoryOrder} from "@/types/aggregator";

const getAllTickersUrl = (): string => {
    return `${getAggregatorHost()}/api/dex/tickers`;
}

const getHistoryUrl = (): string => {
    return `${getAggregatorHost()}/api/dex/history`;
}

export async function getAllTickers(): Promise<MarketData[]> {
    //testing data
    // return JSON.parse('[{"base":"ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518","quote":"ubze","market_id":"ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518/ubze","last_price":190,"base_volume":346.014664,"quote_volume":91079.34488,"bid":185,"ask":245,"high":320,"low":185,"open_price":220,"change":-13.64},{"base":"factory/testbz1972aqfzdg29ugjln74edx0xvcg4ehvyssefa8g/testrtl","quote":"utbz","market_id":"factory/testbz1972aqfzdg29ugjln74edx0xvcg4ehvyssefa8g/testrtl/utbz","last_price":0.0009,"base_volume":3265721.594258,"quote_volume":3000.313867,"bid":0.00089,"ask":0.00092,"high":0.00099,"low":0.00086,"open_price":0.0009,"change":-2.32}]')

    try {
        const resp = await fetch(getAllTickersUrl());
        if (resp.status !== 200) {
            console.error("failed to fetch tickers. status: ", resp.status);
            return [];
        }

        return await resp.json();
    } catch (e) {
        console.error("[AGG] failed to fetch tickers", e);
        return [];
    }
}

export async function getMarketOrdersHistory(marketId: string, limit: number = 1): Promise<HistoryOrder[]> {
    try {
        const url = `${getHistoryUrl()}?market_id=${marketId}&limit=${limit}`;
        const resp = await fetch(url);
        if (resp.status !== 200) {
            return [];
        }

        return await resp.json();
    } catch (e) {
        console.error("[AGG] failed to fetch market orders", e);
        return [];
    }
}
