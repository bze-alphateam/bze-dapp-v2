"use client";

import {Suspense, useCallback, useEffect, useMemo, useState} from 'react';
import {
    Box,
    Container,
    Grid,
    HStack,
    VStack,
    Text,
    Button,
    Badge,
    Input,
    Flex,
    Table, Alert,
} from '@chakra-ui/react';
import { LuTrendingUp, LuTrendingDown, LuActivity, LuArrowLeft, LuX } from 'react-icons/lu';
import {useNavigationWithParams} from "@/hooks/useNavigation";
import {useMarket} from "@/hooks/useMarkets";
import {useAsset} from "@/hooks/useAssets";
import {
    amountToBigNumberUAmount,
    prettyAmount, priceToBigNumberUPrice,
    toBigNumber,
    uAmountToAmount,
    uPriceToPrice
} from "@/utils/amount";
import {
    getAddressFullMarketOrders,
    getMarketBuyOrders,
    getMarketHistory,
    getMarketSellOrders
} from "@/query/markets";
import {ActiveOrders, ORDER_TYPE_BUY, ORDER_TYPE_SELL} from "@/types/market";
import {HistoryOrder} from "@/types/aggregator";
import {getAddressHistory, getTradingViewIntervals} from "@/query/aggregator";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {AggregatedOrderSDKType, HistoryOrderSDKType, OrderSDKType} from "@bze/bzejs/bze/tradebin/store";
import {formatUsdAmount, intlDateFormat} from "@/utils/formatter";
import {useBalance} from "@/hooks/useBalances";
import {useBZETx} from "@/hooks/useTx";
import {useToast} from "@/hooks/useToast";
import {bze} from "@bze/bzejs"
import {useAssetPrice} from "@/hooks/usePrices";
import BigNumber from "bignumber.js";
import {sanitizeNumberInput} from "@/utils/number";
import {calculateAmountFromPrice, calculatePricePerUnit, calculateTotalAmount, getMinAmount} from "@/utils/market";
import {FillOrderItem} from "@bze/bzejs/bze/tradebin/tx";
import {TradeViewChart} from "@/types/charts";
import {getChartIntervalsLimit, getChartMinutes} from "@/utils/charts";
import {LightweightChart} from "@/components/ui/trading/chart";
import {useConnectionType} from "@/hooks/useConnectionType";
import {CONNECTION_TYPE_WS} from "@/types/settings";
import {blockchainEventManager} from "@/service/blockchain_event_manager";
import {getMarketOrderBookChangedEvent} from "@/utils/events";
import {addDebounce} from "@/utils/debounce";

const {createOrder, fillOrders} = bze.tradebin.MessageComposer.withTypeUrl;

function getOrderTxMessages(activeOrders: ActiveOrders, marketId: string, address: string, isBuy: boolean, uAmount: string, uPrice: string) {
    const orderType = isBuy ? 'buy' : 'sell';

    const uPriceNum = new BigNumber(uPrice);
    const ordersFilter = (order: AggregatedOrderSDKType) => {
        const orderuPriceNum = new BigNumber(order.price);
        if (isBuy) {
            return uPriceNum.gt(orderuPriceNum);
        } else {
            return uPriceNum.lt(orderuPriceNum);
        }
    }
    const ordersToSearch = isBuy ? activeOrders.sellOrders.filter(ordersFilter) : activeOrders.buyOrders.filter(ordersFilter);

    //if we have no opposite orders we can create 1 message
    if (ordersToSearch.length === 0) {
        return [
            createOrder({
                creator: address,
                marketId: marketId,
                orderType: orderType,
                amount: uAmount,
                price: uPrice,
            })
        ];
    }

    const msgs = [];
    let uAmountNum = new BigNumber(uAmount);
    //check active orders prices and fill them one by one if needed
    for (let i = 0; i < ordersToSearch.length; i++) {
        const orderUAmountNum = new BigNumber(ordersToSearch[i].amount);
        let msgAmount = ordersToSearch[i].amount;
        if (orderUAmountNum.gt(uAmountNum)) {
            msgAmount = uAmountNum.toString();
        }

        msgs.push(
            createOrder({
                creator: address,
                marketId: marketId,
                orderType: orderType,
                amount: msgAmount,
                price: ordersToSearch[i].price,
            })
        )

        uAmountNum = uAmountNum.minus(msgAmount);
        if (uAmountNum.eq(0)) {
            break;
        }
    }

    if (uAmountNum.gt(0)) {
        msgs.push(
            createOrder({
                creator: address,
                marketId: marketId,
                orderType: orderType,
                amount: uAmountNum.toString(),
                price: uPrice,
            })
        )
    }

    return msgs;
}

interface EmptyTableRowProps {
    colSpan: number;
    message: string;
}

const EmptyTableRow = ({ colSpan, message }: EmptyTableRowProps) => (
    <Table.Row>
        <Table.Cell colSpan={colSpan} textAlign="center" py={8}>
            <Text fontSize="sm" color="fg.muted">{message}</Text>
        </Table.Cell>
    </Table.Row>
);

const TradingPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TradingPageContent />
        </Suspense>
    );
};

const TradingPageContent = () => {
    const [historyTab, setHistoryTab] = useState('market');
    const [timeframe, setTimeframe] = useState('1D');

    // Form state
    const [buyPrice, setBuyPrice] = useState('');
    const [buyAmount, setBuyAmount] = useState('');
    const [buyTotal, setBuyTotal] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [sellTotal, setSellTotal] = useState('');

    const [chartData, setChartData] = useState<TradeViewChart[]>();
    const [activeOrders, setActiveOrders] = useState<ActiveOrders>();
    const [myHistory, setMyHistory] = useState<HistoryOrder[]>([]);
    const [historyOrders, setHistoryOrders] = useState<HistoryOrderSDKType[]>([]);
    const [myOrders, setMyOrders] = useState<OrderSDKType[]>([]);
    const [submittingCancel, setSubmittingCancel] = useState(false);
    const [submittingOrder, setSubmittingOrder] = useState(false);

    const {marketIdParam, toExchangePage} = useNavigationWithParams();

    const {marketData, market, marketId} = useMarket(marketIdParam ?? '')
    const {asset: baseAsset} = useAsset(market?.base ?? '')
    const {asset: quoteAsset} = useAsset(market?.quote ?? '')
    const {address} = useChain(getChainName())
    const {balance: baseBalance, hasAmount: hasBaseAmount} = useBalance(market?.base ?? '')
    const {balance: quoteBalance, hasAmount: hasQuoteAmount} = useBalance(market?.quote ?? '')
    const {totalUsdValue, hasPrice} = useAssetPrice(market?.quote ?? '')
    const {tx} = useBZETx()
    const {toast} = useToast()
    const {connectionType} = useConnectionType()

    const timeframes = ['4H', '1D', '7D', '30D', '1Y'];

    const lastPrice = useMemo(() => {
        if (marketData) {
            return marketData.last_price;
        }

        if (historyOrders && historyOrders.length > 0) {
            return uPriceToPrice(historyOrders[0].price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0);
        }

        return 0;
    }, [marketData, historyOrders, quoteAsset, baseAsset])
    const isNegative = useMemo(() => (marketData?.change || 0) < 0, [marketData]);
    const marketTicker = useMemo(() => {
        if (!baseAsset || !quoteAsset) return '?/?';

        return `${baseAsset?.ticker}/${quoteAsset?.ticker}`
    }, [baseAsset, quoteAsset]);
    const priceColor = useMemo(() => {
        if (!marketData || marketData.change === 0) {
            return 'gray.500';
        }

        return marketData.change < 0 ? 'red.500' : 'green.500';
    }, [marketData])
    const orderTypeColor = useCallback((type: string) => {
        return type === ORDER_TYPE_BUY ? 'red.500' : 'green.500';
    }, [])
    const formattedDateFromTimestamp = useCallback((timestamp: BigNumber|bigint|string, ms?: boolean) => {
        return intlDateFormat.format(new Date(toBigNumber(timestamp).multipliedBy(ms ? 1000 : 1).toNumber()))
    }, [])

    const dailyVolume = useMemo(() => {
        if (!marketData) return '0';

        return prettyAmount(marketData.quote_volume)
    }, [marketData])
    const displayBaseBalance = useMemo(() => {
        if (!baseBalance) return '0';
        return prettyAmount(uAmountToAmount(baseBalance.amount, baseAsset?.decimals || 0))
    }, [baseBalance, baseAsset])
    const displayQuoteBalance = useMemo(() => {
        if (!quoteBalance) return '0';
        return prettyAmount(uAmountToAmount(quoteBalance.amount, quoteAsset?.decimals || 0))
    }, [quoteBalance, quoteAsset])
    const quoteUsdValue = useCallback((value: number|bigint|BigNumber|string|undefined) => {
        if (!value) return '0';
        return formatUsdAmount(totalUsdValue(toBigNumber(value)))
    }, [totalUsdValue])
    const shouldShowUsdValues = useMemo(() => hasPrice && !quoteAsset?.stable, [hasPrice, quoteAsset])

    const fetchActiveOrders = useCallback(async () => {
        if (!marketId || marketId === '') {
            return;
        }

        const [buy, sell] = await Promise.all([getMarketBuyOrders(marketId), getMarketSellOrders(marketId)]);

        setActiveOrders(
            {
                buyOrders: buy.list,
                sellOrders: sell.list.reverse(),
            }
        );
    }, [marketId])
    const fetchMyHistory = useCallback(async () => {
        if (!address || !marketId || marketId === '') {
            return;
        }

        const data = await getAddressHistory(address, marketId);
        setMyHistory(data);
    }, [address, marketId])
    const fetchMarketHistory = useCallback(async () => {
        if (!marketId || marketId === '') {
            return;
        }
        const history = await getMarketHistory(marketId);
        setHistoryOrders(history.list);
    }, [marketId])
    const fetchMyOrders = useCallback(async () => {
        if (!marketId || marketId === '') {
            return;
        }

        if (address === undefined) {
            setMyOrders([]);
            return;
        }

        const ord = await getAddressFullMarketOrders(marketId, address);
        setMyOrders(ord);
    }, [marketId, address])
    const fetchChartData = useCallback(async () => {
        if (!marketId || marketId === '') return;

        const chart = await getTradingViewIntervals(
            marketId,
            getChartMinutes(timeframe),
            getChartIntervalsLimit(timeframe),
        );

        setChartData(chart);
    }, [marketId, timeframe])

    //on component mount
    const onMount = useCallback(async () => {
        fetchActiveOrders();
        fetchMyHistory();
        fetchMarketHistory();
        fetchMyOrders();
        fetchChartData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // cancel order/s
    const onOrderCancelClick = useCallback(async (orders: OrderSDKType[]) => {
        if (orders.length === 0) return;

        const {cancelOrder} = bze.tradebin.MessageComposer.withTypeUrl;
        if (!address || !tx) {
            toast.error('Please connect your wallet');
            return;
        }

        setSubmittingCancel(true)
        const msgs = [];
        for (const order of orders) {
            const msg = cancelOrder({
                creator: address,
                marketId: order.market_id,
                orderId: order.id,
                orderType: order.order_type,
            });
            msgs.push(msg);
        }

        await tx(msgs);

        fetchMyOrders()
        setSubmittingCancel(false);
    }, [address, tx, toast, fetchMyOrders])

    //buy form
    const onBuyPriceChange = useCallback((price: string) => {
        setBuyPrice(price);
        if (price === '') {
            setBuyTotal('');
            return;
        }

        const total = calculateTotalAmount(price, buyAmount, quoteAsset?.decimals || 0);
        if (total !== '') {
            setBuyTotal(total);
        } else {
            setBuyAmount(calculateAmountFromPrice(price, buyTotal, baseAsset?.decimals || 0));
        }
    }, [buyAmount, buyTotal, quoteAsset, baseAsset])
    const onBuyAmountChange = useCallback((amount: string) => {
        setBuyAmount(amount);
        if (amount === '') {
            setBuyTotal('');
            return;
        }

        const total = calculateTotalAmount(buyPrice, amount, quoteAsset?.decimals || 0);
        if (total !== '') {
            setBuyTotal(total);
        } else {
            setBuyPrice(calculatePricePerUnit(amount, buyTotal, quoteAsset?.decimals || 0));
        }
    }, [buyPrice, buyTotal, quoteAsset])
    const onBuyTotalChange = useCallback((total: string) => {
        setBuyTotal(total);
        const amount = calculateAmountFromPrice(buyPrice, total, quoteAsset?.decimals || 0);
        if (amount !== '') {
            setBuyAmount(amount);
        } else {
            setBuyPrice(calculatePricePerUnit(buyAmount, total, baseAsset?.decimals || 0));
        }
    }, [buyPrice, buyAmount, quoteAsset, baseAsset])

    //sell form
    const onSellPriceChange = useCallback((price: string) => {
        setSellPrice(price);
        if (price === '') {
            setSellTotal('');
            return;
        }

        const total = calculateTotalAmount(price, sellAmount, quoteAsset?.decimals || 0);
        if (total !== '') {
            setSellTotal(total);
        } else {
            setSellAmount(calculateAmountFromPrice(price, sellTotal, baseAsset?.decimals || 0));
        }
    }, [sellAmount, sellTotal, quoteAsset, baseAsset])
    const onSellAmountChange = useCallback((amount: string) => {
        setSellAmount(amount);
        if (amount === '') {
            setSellTotal('');
            return;
        }

        const total = calculateTotalAmount(sellPrice, amount, quoteAsset?.decimals || 0);
        if (total !== '') {
            setSellTotal(total);
        } else {
            setSellPrice(calculatePricePerUnit(amount, sellTotal, quoteAsset?.decimals || 0));
        }
    }, [sellPrice, sellTotal, quoteAsset])
    const onSellTotalChange = useCallback((total: string) => {
        setSellTotal(total);
        const amount = calculateAmountFromPrice(sellPrice, total, quoteAsset?.decimals || 0);
        if (amount !== '') {
            setSellAmount(amount);
        } else {
            setSellPrice(calculatePricePerUnit(sellAmount, total, baseAsset?.decimals || 0));
        }
    }, [sellPrice, sellAmount, quoteAsset, baseAsset])

    const onOrderBookClick = useCallback((price: string, amount: string) => {
        setBuyPrice(price);
        setSellPrice(price);

        setBuyAmount(amount);
        setSellAmount(amount);

        const total = calculateTotalAmount(price, amount, quoteAsset?.decimals || 0);
        setSellTotal(total);
        setBuyTotal(total);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    //order submit functions
    const getMatchingOrders = useCallback((orderType: string, uPrice: BigNumber, uAmount: BigNumber): AggregatedOrderSDKType[] => {
        if (!activeOrders) return [];

        if (uPrice.isNaN() || uPrice.lte(0) || uAmount.isNaN() || uAmount.lte(0)) {
            return [];
        }

        const isBuy = orderType === ORDER_TYPE_BUY;
        let toCheck: AggregatedOrderSDKType[];
        if (isBuy) {
            //reverse them to check from the lowest price to the highest one
            //unpack in a new array to avoid reversing the original one
            toCheck = [...activeOrders.sellOrders].reverse();
        } else {
            toCheck = activeOrders.buyOrders;
        }

        if (toCheck.length <= 1) {
            return [];
        }

        //check the provided price with the first order price in the order book
        const firstOrderPrice = new BigNumber(toCheck[0].price);
        if ((isBuy && firstOrderPrice.gte(uPrice)) || (!isBuy && firstOrderPrice.lte(uPrice))) {
            return [];
        }

        let finishFunc = (p: BigNumber, c: string) => p.gt(c);
        if (isBuy) {
            finishFunc = (p: BigNumber, c: string) => p.lt(c);
        }

        const result = [];
        for (let i = 0; i < toCheck.length; i++) {
            if (finishFunc(uPrice, toCheck[i].price)) {
                break;
            }
            if (uAmount.lte(0)) {
                break;
            }

            const orderCopy = {...toCheck[i]};
            if (uAmount.minus(toCheck[i].amount).lt(0)) {
                orderCopy.amount = uAmount.toString();
            }

            result.push(orderCopy);
            uAmount = uAmount.minus(orderCopy.amount);
        }

        return result;
    }, [activeOrders])
    const submitFillOrdersMsg = useCallback(async (toFill: AggregatedOrderSDKType[]) => {
        if (!marketId || marketId === '' || !address || !tx) {
            return;
        }

        setSubmittingOrder(true)
        const msgOrders: FillOrderItem[] = [];
        for (let i = 0; i < toFill.length; i++) {
            msgOrders.push({
                price: toFill[i].price,
                amount: toFill[i].amount,
            })
        }

        const msg = fillOrders({
            creator: address,
            marketId: marketId,
            orderType: toFill[0].order_type, //use first order to specify what orders we fill
            orders: msgOrders,
        })

        await tx([msg]);

        setSubmittingOrder(false);
    }, [marketId, address, tx])
    const submitCreateOrderMsg = useCallback(async (orderType: string, uPrice: BigNumber, uAmount: BigNumber) => {
        if (!address || !tx || !activeOrders || !marketId || marketId === '') {
            toast.error('Please connect your wallet');
            return;
        }

        const isBuy = orderType === ORDER_TYPE_BUY;
        if (isBuy) {
            if (activeOrders.sellOrders.length > 0) {
                const maxPrice = activeOrders.sellOrders[activeOrders.sellOrders.length - 1].price;
                if (uPrice.gt(maxPrice)) {
                    toast.error('Price is too high. You can buy at a lower price');
                    return;
                }
            }
        } else {
            if (activeOrders.buyOrders.length > 0) {
                const minPrice = activeOrders.buyOrders[0].price;
                if (uPrice.lt(minPrice)) {
                    toast.error('Price is too low. You can sell at a higher price');
                    return;
                }
            }
        }

        setSubmittingOrder(true);
        const msgs = getOrderTxMessages(activeOrders, marketId, address, isBuy, uAmount.toString(), uPrice.toString());

        await tx(msgs);

        setSubmittingOrder(false);
    }, [address, tx, activeOrders, toast, marketId])
    const onOrderSubmit = useCallback(async (orderType: string) => {
        if (!address || !tx) {
            toast.error('Please connect your wallet');
            return;
        }
        if (!quoteAsset || !baseAsset) {
            toast.error('Market is not tradeable');
            return;
        }

        //using only smallest amounts (uAmount, uPrice)
        let amount = amountToBigNumberUAmount(buyAmount, baseAsset.decimals || 0)
        let price = priceToBigNumberUPrice(buyPrice, quoteAsset.decimals, baseAsset.decimals)
        if (orderType === ORDER_TYPE_SELL) {
            amount = amountToBigNumberUAmount(sellAmount, baseAsset.decimals || 0)
            price = priceToBigNumberUPrice(sellPrice, quoteAsset.decimals, baseAsset.decimals)
        }

        if (!amount.isPositive()) {
            toast.error('Invalid amount');
            return;
        }
        if (!price.isPositive()) {
            toast.error('Invalid price');
            return;
        }

        if (orderType === ORDER_TYPE_BUY && !hasQuoteAmount(amount.multipliedBy(price))) {
            //he must have enough quote asset balance
            toast.error(`Insufficient ${quoteAsset.ticker} balance`);
            return;
        }
        if (orderType === ORDER_TYPE_SELL && !hasBaseAmount(amount)) {
            toast.error(`Insufficient ${baseAsset.ticker} balance`);
            return;
        }

        const minAmount = getMinAmount(price, baseAsset.decimals)
        if (amount.lt(minAmount)) {
            toast.error(`Minimum amount is ${prettyAmount(uAmountToAmount(minAmount, baseAsset.decimals))} ${baseAsset.ticker}`);
            return;
        }

        const toFill = getMatchingOrders(orderType, price, amount);
        if (toFill.length === 0) {
            return submitCreateOrderMsg(orderType, price, amount);
        } else if (toFill.length === 1) {
            return submitCreateOrderMsg(orderType, toBigNumber(toFill[0].price), amount);
        }

        return submitFillOrdersMsg(toFill);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteAsset, baseAsset, buyAmount, buyPrice, sellAmount, sellPrice, hasQuoteAmount, hasBaseAmount, getMatchingOrders, submitCreateOrderMsg, submitFillOrdersMsg])

    const multipleOrdersFillMessage = useCallback((orderType: string, price: string, amount: string) => {
        if (!activeOrders) return undefined;
        const toFill = getMatchingOrders(
            orderType,
            priceToBigNumberUPrice(price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0),
            amountToBigNumberUAmount(amount, baseAsset?.decimals || 0)
        );

        const toFillCount = toFill.length;
        if (toFillCount > 1) {
            return `Match orders with price from ${uPriceToPrice(toFill[0].price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)} to ${uPriceToPrice(toFill[toFillCount - 1].price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)}`
        }

        return undefined;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOrders, baseAsset, quoteAsset])
    const buyFillMessage = useMemo(() => {
        if (buyPrice === '' || buyAmount === '') return undefined;

        return multipleOrdersFillMessage(ORDER_TYPE_BUY, buyPrice, buyAmount);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buyPrice, buyAmount])
    const sellFillMessage = useMemo(() => {
        if (sellPrice === '' || sellAmount === '') return undefined;
        return multipleOrdersFillMessage(ORDER_TYPE_SELL, sellPrice, sellAmount);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellPrice, sellAmount])

    useEffect(() => {
        if (!marketId || marketId === '') return
        onMount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketId]);

    useEffect(() => {
        if (!marketId || marketId === '' || connectionType === undefined) return
        let unsubscribe: () => void;
        let refreshInterval: NodeJS.Timeout;

        //depending on the connection type we have in this page we want to update the trading data
        if (connectionType === CONNECTION_TYPE_WS) {
            unsubscribe = blockchainEventManager.subscribe(getMarketOrderBookChangedEvent(marketId), () => {
                //after 200ms reload the entire page date
                addDebounce(`update-trading-page-${marketId}`, 200, onMount);

                // after 3 seconds reload the chart data - chart data comes from Aggregator API - it might get there
                // with some delay
                addDebounce(`update-trading-page-chart-${marketId}`, 3000, fetchChartData);
            })
        } else {
            refreshInterval = setInterval(() => {
                onMount()
            }, 15 * 1000)
        }

        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval)
            }

            if (unsubscribe) {
                unsubscribe()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionType, marketId]);

    return (
        <Container maxW="full" py={4}>
            <VStack gap={4} align="stretch">
                {/* Market Header */}
                <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                        <HStack>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toExchangePage()}
                            >
                                <LuArrowLeft />Markets
                            </Button>
                            <Box h="4" w="1px" bg="border" />
                            <VStack align="start" gap={1}>
                                <HStack>
                                    <Text fontSize="xl" fontWeight="bold">{marketTicker}</Text>
                                    <Badge colorPalette={(marketData?.change || 0) > 0 ? 'green' : 'red'} variant="subtle">
                                        {marketData?.change || 0}%
                                    </Badge>
                                </HStack>
                                <VStack align="start" gap={-1}>
                                    <Text fontSize="2xl" fontWeight="bold" color={priceColor}>
                                        {lastPrice} {quoteAsset?.ticker}
                                    </Text>
                                    {shouldShowUsdValues && (
                                        <Text fontSize="xs" color={priceColor}>
                                            ${quoteUsdValue(marketData?.last_price)}
                                        </Text>
                                    )}
                                </VStack>
                            </VStack>
                        </HStack>

                        <HStack gap={6} display={{ base: 'none', lg: 'flex' }}>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                                <Text fontSize="sm" fontWeight="medium">{dailyVolume} {quoteAsset?.ticker}</Text>
                                {shouldShowUsdValues && (
                                    <Text fontSize="xs" color="fg.muted">
                                        ${quoteUsdValue(marketData?.quote_volume)}
                                    </Text>
                                )}
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h High</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.high || 0}</Text>
                                {shouldShowUsdValues && (
                                    <Text fontSize="xs" color="fg.muted">
                                        ${quoteUsdValue(marketData?.high)}
                                    </Text>
                                )}
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Low</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.low || 0}</Text>
                                {shouldShowUsdValues && (
                                    <Text fontSize="xs" color="fg.muted">
                                        ${quoteUsdValue(marketData?.low)}
                                    </Text>
                                )}
                            </VStack>
                        </HStack>
                    </Flex>
                </Box>

                {/* Main Trading Layout */}
                <Grid templateColumns={{ base: '1fr', lg: '280px 1fr 320px' }} gap={4}>
                    {/* Left: Order Book */}
                    <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                        <Text fontWeight="bold" mb={3}>Order Book</Text>
                        <VStack gap={2} align="stretch">
                            {/* Asks */}
                            <Box>
                                <HStack justify="space-between" mb={2}>
                                    <Text fontSize="xs" color="fg.muted">Price ({quoteAsset?.ticker})</Text>
                                    <Text fontSize="xs" color="fg.muted">Amount ({baseAsset?.ticker})</Text>
                                </HStack>
                                {activeOrders?.sellOrders.map((ask, i) => {
                                    const transformedPrice = uPriceToPrice(ask.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)
                                    const transformedAmount = uAmountToAmount(ask.amount, baseAsset?.decimals || 0)
                                    return (
                                        <HStack key={i} justify="space-between" fontSize="xs" py={1} onClick={() => onOrderBookClick(transformedPrice, transformedAmount)}>
                                            <Text color="red.500">{transformedPrice}</Text>
                                            <Text>{transformedAmount}</Text>
                                        </HStack>
                                    )
                                })}
                                {(!activeOrders || activeOrders.sellOrders.length === 0) && (
                                    <Box p={6} textAlign="center">
                                        <Text fontSize="sm" color="fg.muted">No sell orders</Text>
                                    </Box>
                                )}
                            </Box>

                            {/* Current Price */}
                            <Box py={2} bg="bg.muted" borderRadius="sm">
                                <HStack justify="center">
                                    <Text fontSize="md" fontWeight="bold" color={priceColor}>
                                        {lastPrice}
                                    </Text>
                                    {isNegative ? (
                                        <LuTrendingDown color="red" size={16} />
                                    ) : (
                                        <LuTrendingUp color="green" size={16} />
                                    )}
                                </HStack>
                            </Box>

                            {/* Bids */}
                            <Box>
                                {activeOrders?.buyOrders.map((bid, i) => {
                                    const transformedPrice = uPriceToPrice(bid.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)
                                    const transformedAmount = uAmountToAmount(bid.amount, baseAsset?.decimals || 0)
                                    return (
                                        <HStack key={i} justify="space-between" fontSize="xs" py={1} onClick={() => onOrderBookClick(transformedPrice, transformedAmount)}>
                                            <Text color="green.500">{transformedPrice}</Text>
                                            <Text>{transformedAmount}</Text>
                                        </HStack>
                                    )
                                })}
                                {(!activeOrders || activeOrders?.buyOrders.length === 0 ) && (
                                    <Box p={6} textAlign="center">
                                        <Text fontSize="sm" color="fg.muted">No buy orders</Text>
                                    </Box>
                                )}
                            </Box>
                        </VStack>
                    </Box>

                    {/* Center: Chart */}
                    <VStack gap={3} align="stretch">
                        <Box p={3} bg="bg.panel" borderRadius="md" borderWidth="1px" minH="400px">
                            <HStack justify="space-between" mb={3}>
                                <HStack>
                                    <LuActivity color="gray" size={16} />
                                    <Text fontWeight="medium" fontSize="sm">Price Chart</Text>
                                </HStack>
                                <HStack gap={1}>
                                    {timeframes.map((tf) => (
                                        <Button
                                            key={tf}
                                            size="xs"
                                            variant={timeframe === tf ? 'solid' : 'ghost'}
                                            onClick={() => setTimeframe(tf)}
                                        >
                                            {tf}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>

                            {/* Smaller Chart */}
                            <Box h="350px" w="100%" borderRadius="md" overflow="hidden">
                                <LightweightChart priceData={chartData || []} chartType={timeframe} />
                            </Box>
                        </Box>

                        {/* Buy/Sell Forms */}
                        <Grid templateColumns="1fr 1fr" gap={3}>
                            {/* Buy Form */}
                            <Box p={3} bg="bg.panel" borderRadius="md" borderWidth="1px">
                                <Text fontWeight="bold" mb={3} color="green.500" fontSize="sm">Buy {baseAsset?.ticker}</Text>
                                <VStack gap={2} align="stretch">
                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Price</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={buyPrice}
                                                onChange={(e) => onBuyPriceChange(sanitizeNumberInput(e.target.value))}
                                                pr="12"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {quoteAsset?.ticker}
                                            </Text>
                                        </Box>
                                        {buyPrice && shouldShowUsdValues && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                ≈ ${quoteUsdValue(buyPrice)}
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Amount</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={buyAmount}
                                                onChange={(e) => onBuyAmountChange(sanitizeNumberInput(e.target.value))}
                                                pr="10"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {baseAsset?.ticker}
                                            </Text>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Total</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={buyTotal}
                                                onChange={(e) => onBuyTotalChange(sanitizeNumberInput(e.target.value))}
                                                pr="12"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {quoteAsset?.ticker}
                                            </Text>
                                        </Box>
                                        {buyTotal && shouldShowUsdValues && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                ≈ ${quoteUsdValue(buyTotal)}
                                            </Text>
                                        )}
                                    </Box>
                                    {buyFillMessage && (
                                        <Alert.Root status={'neutral'} variant='subtle'>
                                            <Alert.Indicator />
                                            <VStack align="start" gap="2" flex="1">
                                                <Text fontSize="xs" color="fg.muted" mt={1}>{buyFillMessage}</Text>
                                            </VStack>
                                        </Alert.Root>
                                    )}
                                    <Button
                                        colorPalette="green"
                                        size="sm"
                                        mt={2}
                                        disabled={submittingOrder}
                                        variant={'outline'}
                                        onClick={() => onOrderSubmit(ORDER_TYPE_BUY)}
                                    >
                                        Buy {baseAsset?.ticker}
                                    </Button>
                                </VStack>
                            </Box>

                            {/* Sell Form */}
                            <Box p={3} bg="bg.panel" borderRadius="md" borderWidth="1px">
                                <Text fontWeight="bold" mb={3} color="red.500" fontSize="sm">Sell {baseAsset?.ticker}</Text>
                                <VStack gap={2} align="stretch">
                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Price</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={sellPrice}
                                                onChange={(e) => onSellPriceChange(sanitizeNumberInput(e.target.value))}
                                                pr="12"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {quoteAsset?.ticker}
                                            </Text>
                                        </Box>
                                        {sellPrice && shouldShowUsdValues && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                ≈ ${quoteUsdValue(sellPrice)}
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Amount</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={sellAmount}
                                                onChange={(e) => onSellAmountChange(sanitizeNumberInput(e.target.value))}
                                                pr="10"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {baseAsset?.ticker}
                                            </Text>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Total</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={sellTotal}
                                                onChange={(e) => onSellTotalChange(sanitizeNumberInput(e.target.value))}
                                                pr="12"
                                                disabled={submittingOrder}
                                            />
                                            <Text
                                                position="absolute"
                                                right="2"
                                                top="50%"
                                                transform="translateY(-50%)"
                                                fontSize="xs"
                                                color="fg.muted"
                                            >
                                                {quoteAsset?.ticker}
                                            </Text>
                                        </Box>
                                        {sellTotal && shouldShowUsdValues && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                ≈ ${quoteUsdValue(sellTotal)}
                                            </Text>
                                        )}
                                    </Box>
                                    {sellFillMessage && (
                                        <Alert.Root status={'neutral'} variant='subtle'>
                                            <Alert.Indicator />
                                            <VStack align="start" gap="2" flex="1">
                                                <Text fontSize="xs" color="fg.muted" mt={1}>{sellFillMessage}</Text>
                                            </VStack>
                                        </Alert.Root>
                                    )}
                                    <Button
                                        colorPalette="red"
                                        size="sm"
                                        mt={2}
                                        disabled={submittingOrder}
                                        variant={'outline'}
                                        onClick={() => onOrderSubmit(ORDER_TYPE_SELL)}
                                    >
                                        Sell {baseAsset?.ticker}
                                    </Button>
                                </VStack>
                            </Box>
                        </Grid>
                    </VStack>

                    {/* Right: Market History/My History & Active Orders */}
                    <VStack gap={4} align="stretch">
                        {/* Market History - Improved */}
                        <Box bg="bg.panel" borderRadius="md" borderWidth="1px" overflow="hidden">
                            <HStack p={3} borderBottomWidth="1px">
                                <Button
                                    size="xs"
                                    variant={historyTab === 'market' ? 'solid' : 'ghost'}
                                    onClick={() => setHistoryTab('market')}
                                >
                                    Market History
                                </Button>
                                <Button
                                    size="xs"
                                    variant={historyTab === 'my' ? 'solid' : 'ghost'}
                                    onClick={() => setHistoryTab('my')}
                                >
                                    My History
                                </Button>
                            </HStack>

                            <Box maxH="300px" overflowY="auto">
                                <Table.Root size="sm" variant="outline">
                                    <Table.Header position='sticky' top={0} bg="bg.panel">
                                        <Table.Row>
                                            <Table.ColumnHeader>
                                                <Text fontSize="xs" color="fg.muted">Price</Text>
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign="right">
                                                <Text fontSize="xs" color="fg.muted">Amount</Text>
                                            </Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign="right">
                                                <Text fontSize="xs" color="fg.muted">Time</Text>
                                            </Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {historyTab === 'market' && historyOrders.map((trade, i) => (
                                            <Table.Row key={i}>
                                                <Table.Cell>
                                                    <Text fontSize="xs" color={orderTypeColor(trade.order_type)} fontWeight="medium">
                                                        {uPriceToPrice(trade.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell textAlign="right">
                                                    <Text fontSize="xs">{uAmountToAmount(trade.amount, baseAsset?.decimals || 0)}</Text>
                                                </Table.Cell>
                                                <Table.Cell textAlign="right">
                                                    <Text fontSize="xs" color="fg.muted">
                                                        {formattedDateFromTimestamp(trade.executed_at, true)}
                                                    </Text>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                        {historyTab === 'market' && historyOrders.length === 0 && (
                                            <EmptyTableRow colSpan={3} message={'No market history'} />
                                        )}
                                        {historyTab === 'my' && myHistory.map((trade, i) => (
                                            <Table.Row key={i}>
                                                <Table.Cell>
                                                    <Text fontSize="xs" color={orderTypeColor(trade.order_type)} fontWeight="medium">
                                                        {trade.price}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell textAlign="right">
                                                    <Text fontSize="xs">{trade.base_volume}</Text>
                                                </Table.Cell>
                                                <Table.Cell textAlign="right">
                                                    <Text fontSize="xs" color="fg.muted">{formattedDateFromTimestamp(trade.executed_at)}</Text>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                        {historyTab === 'my' && myHistory.length === 0 && (
                                            <EmptyTableRow colSpan={3} message={'No history'}/>
                                        )}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                        </Box>

                        {/* Active Orders - Improved */}
                        <Box bg="bg.panel" borderRadius="md" borderWidth="1px" overflow="hidden">
                            <HStack justify="space-between" p={3} borderBottomWidth="1px">
                                <Text fontWeight="bold" fontSize="sm">Your Orders</Text>
                                {myOrders.length > 0 && (
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => onOrderCancelClick(myOrders)}
                                        loading={submittingCancel}
                                    >
                                        Cancel All
                                    </Button>
                                )}
                            </HStack>

                            {myOrders.length === 0 ? (
                                <Box p={6} textAlign="center">
                                    <Text fontSize="sm" color="fg.muted">No active orders</Text>
                                </Box>
                            ) : (
                                <Box maxH="300px" overflowY="auto">
                                    <Table.Root size="sm" variant="outline">
                                        <Table.Header position="sticky" top={0} bg="bg.panel">
                                            <Table.Row>
                                                <Table.ColumnHeader>
                                                    <Text fontSize="xs" color="fg.muted">Type</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader textAlign="right">
                                                    <Text fontSize="xs" color="fg.muted">Price</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader textAlign="right">
                                                    <Text fontSize="xs" color="fg.muted">Amount</Text>
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader textAlign="right" />
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {myOrders.map((order, i) => (
                                                <Table.Row key={i}>
                                                    <Table.Cell>
                                                        <Badge
                                                            size="xs"
                                                            colorPalette={order.order_type === ORDER_TYPE_BUY ? 'green' : 'red'}

                                                        >
                                                            {order.order_type === ORDER_TYPE_BUY ? 'BUY' : 'SELL'}
                                                        </Badge>
                                                    </Table.Cell>
                                                    <Table.Cell textAlign="right">
                                                        <Text fontSize="xs" fontWeight="medium">
                                                            {uPriceToPrice(order.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)}
                                                        </Text>
                                                    </Table.Cell>
                                                    <Table.Cell textAlign="right">
                                                        <Text fontSize="xs">
                                                            {uAmountToAmount(order.amount, baseAsset?.decimals || 0)}
                                                        </Text>
                                                    </Table.Cell>
                                                    <Table.Cell textAlign="right">
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            onClick={() => onOrderCancelClick([order])}
                                                            loading={submittingCancel}
                                                        >
                                                            <LuX size={12} />
                                                        </Button>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>
                            )}
                        </Box>

                        {/* Balance */}
                        <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                            <Text fontWeight="bold" mb={3} fontSize="sm">Balance</Text>
                            <VStack align="stretch" gap={2}>
                                <HStack justify="space-between">
                                    <Text fontSize="xs" color="fg.muted">{baseAsset?.ticker}</Text>
                                    <Text fontSize="xs" fontWeight="medium">{displayBaseBalance}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text fontSize="xs" color="fg.muted">{quoteAsset?.ticker}</Text>
                                    <Text fontSize="xs" fontWeight="medium">{displayQuoteBalance}</Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </VStack>
                </Grid>
            </VStack>
        </Container>
    );
};

export default TradingPage;