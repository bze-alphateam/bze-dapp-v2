export interface Attribute {
    key: string;
    value: string;
    index: boolean;
}

export interface TendermintEvent {
    type: string;
    attributes: Attribute[];
}

export interface InternalEvent {
    marketId?: string;
}

export type EventCallback = (event?: InternalEvent) => void;

export const CURRENT_WALLET_BALANCE_EVENT = "current_wallet_balance";
export const ORDER_EXECUTED_EVENT = "order_executed";
export const ORDER_BOOK_CHANGED_EVENT = "order_book_changed";
