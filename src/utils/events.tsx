import {ORDER_BOOK_CHANGED_EVENT} from "@/types/events";

export const getMarketOrderBookChangedEvent = (marketId: string) => getMarketEventKey(ORDER_BOOK_CHANGED_EVENT, marketId)
export const getMarketEventKey = (eventType: string, marketId: string) => `${eventType}:${marketId}`
