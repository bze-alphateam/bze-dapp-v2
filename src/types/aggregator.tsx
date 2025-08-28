export interface HistoryOrder {
    "order_id": number;
    "price": string | number;
    "base_volume": string | number;
    "quote_volume": string | number;
    "executed_at": string;
    "order_type": string;
    "maker": string;
    "taker": string;
}