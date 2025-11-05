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
    Table,
} from '@chakra-ui/react';
import { LuTrendingUp, LuTrendingDown, LuActivity, LuChartBar, LuArrowLeft, LuX } from 'react-icons/lu';
import {useNavigationWithParams} from "@/hooks/useNavigation";
import {useMarket} from "@/hooks/useMarkets";
import {useAsset} from "@/hooks/useAssets";
import {prettyAmount, toBigNumber, uAmountToAmount, uPriceToPrice} from "@/utils/amount";
import {
    getAddressFullMarketOrders,
    getMarketBuyOrders,
    getMarketHistory,
    getMarketSellOrders
} from "@/query/markets";
import {ActiveOrders, ORDER_TYPE_BUY} from "@/types/market";
import {HistoryOrder} from "@/types/aggregator";
import {getAddressHistory} from "@/query/aggregator";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {HistoryOrderSDKType, OrderSDKType} from "@bze/bzejs/bze/tradebin/store";
import {formatUsdAmount, intlDateFormat} from "@/utils/formatter";
import {useBalance} from "@/hooks/useBalances";
import {useBZETx} from "@/hooks/useTx";
import {useToast} from "@/hooks/useToast";
import {bze} from "@bze/bzejs"
import {useAssetPrice} from "@/hooks/usePrices";
import BigNumber from "bignumber.js";


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

    const [activeOrders, setActiveOrders] = useState<ActiveOrders>();
    const [myHistory, setMyHistory] = useState<HistoryOrder[]>([]);
    const [historyOrders, setHistoryOrders] = useState<HistoryOrderSDKType[]>([]);
    const [myOrders, setMyOrders] = useState<OrderSDKType[]>([]);
    const [submittingCancel, setSubmittingCancel] = useState(false);

    const {marketIdParam, toExchangePage} = useNavigationWithParams();

    const {marketData, market} = useMarket(marketIdParam ?? '')
    const {asset: baseAsset} = useAsset(market?.base ?? '')
    const {asset: quoteAsset} = useAsset(market?.quote ?? '')
    const {address} = useChain(getChainName())
    const {balance: baseBalance} = useBalance(market?.base ?? '')
    const {balance: quoteBalance} = useBalance(market?.quote ?? '')
    const {totalUsdValue, hasPrice} = useAssetPrice(market?.quote ?? '')
    const {tx} = useBZETx()
    const {toast} = useToast()

    const timeframes = ['4H', '1D', '7D', '30D', '1Y'];

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
        if (!marketData?.market_id) {
            return;
        }

        const [buy, sell] = await Promise.all([getMarketBuyOrders(marketData.market_id), getMarketSellOrders(marketData.market_id)]);

        setActiveOrders(
            {
                buyOrders: buy.list,
                sellOrders: sell.list.reverse(),
            }
        );
    }, [marketData])

    const fetchMyHistory = useCallback(async () => {
        if (!address || !marketData) {
            return;
        }

        const data = await getAddressHistory(address, marketData.market_id);
        setMyHistory(data);
    }, [address, marketData])

    const fetchMarketHistory = useCallback(async () => {
        if (!marketData) {
            return;
        }
        const history = await getMarketHistory(marketData.market_id);
        setHistoryOrders(history.list);
    }, [marketData])

    const fetchMyOrders = useCallback(async () => {
        if (!marketData) {
            return;
        }

        if (address === undefined) {
            setMyOrders([]);
            return;
        }

        const ord = await getAddressFullMarketOrders(marketData.market_id, address);
        setMyOrders(ord);
    }, [marketData, address])

    const onMount = useCallback(async () => {
        fetchActiveOrders();
        fetchMyHistory();
        fetchMarketHistory();
        fetchMyOrders();
    }, [fetchActiveOrders, fetchMyHistory, fetchMarketHistory, fetchMyOrders])

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

    useEffect(() => {
        onMount();
    }, [onMount]);

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
                                    <Badge colorScheme={priceColor} variant="subtle">
                                        {marketData?.change}%
                                    </Badge>
                                </HStack>
                                <VStack align="start" gap={-1}>
                                    <Text fontSize="2xl" fontWeight="bold" color={priceColor}>
                                        {marketData?.last_price} {quoteAsset?.ticker}
                                    </Text>
                                    {shouldShowUsdValues && (
                                        <Text fontSize="xs" color={priceColor}>
                                            {quoteUsdValue(marketData?.last_price)} USD
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
                                        {quoteUsdValue(marketData?.quote_volume)} USD
                                    </Text>
                                )}
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h High</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.high || 0}</Text>
                                {shouldShowUsdValues && (
                                    <Text fontSize="xs" color="fg.muted">
                                        {quoteUsdValue(marketData?.high)} USD
                                    </Text>
                                )}
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Low</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.low || 0}</Text>
                                {shouldShowUsdValues && (
                                    <Text fontSize="xs" color="fg.muted">
                                        {quoteUsdValue(marketData?.low)} USD
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
                                {activeOrders?.sellOrders.map((ask, i) => (
                                    <HStack key={i} justify="space-between" fontSize="xs" py={1}>
                                        <Text color="red.500">{ask.price}</Text>
                                        <Text>{uAmountToAmount(ask.amount, baseAsset?.decimals || 0)}</Text>
                                    </HStack>
                                ))}
                                {activeOrders?.sellOrders.length === 0 && (
                                    <Box p={6} textAlign="center">
                                        <Text fontSize="sm" color="fg.muted">No sell orders</Text>
                                    </Box>
                                )}
                            </Box>

                            {/* Current Price */}
                            <Box py={2} bg="bg.muted" borderRadius="sm">
                                <HStack justify="center">
                                    <Text fontSize="md" fontWeight="bold" color={priceColor}>
                                        {marketData?.last_price}
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
                                {activeOrders?.buyOrders.map((bid, i) => (
                                    <HStack key={i} justify="space-between" fontSize="xs" py={1}>
                                        <Text color="green.500">{bid.price}</Text>
                                        <Text>{uAmountToAmount(bid.amount, baseAsset?.decimals || 0)}</Text>
                                    </HStack>
                                ))}
                                {activeOrders?.buyOrders.length === 0 && (
                                    <Box p={6} textAlign="center">
                                        <Text fontSize="sm" color="fg.muted">No buy orders</Text>
                                    </Box>
                                )}
                            </Box>
                        </VStack>
                    </Box>

                    {/* Center: Chart */}
                    <VStack gap={3} align="stretch">
                        <Box p={3} bg="bg.panel" borderRadius="md" borderWidth="1px">
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
                            <Flex h="200px" align="center" justify="center" bg="bg.muted" borderRadius="md">
                                <VStack>
                                    <LuChartBar size={32} color="gray" />
                                    <Text color="fg.muted" fontSize="sm">Chart placeholder</Text>
                                </VStack>
                            </Flex>
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
                                                onChange={(e) => setBuyPrice(e.target.value)}
                                                pr="12"
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
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Amount</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={buyAmount}
                                                onChange={(e) => setBuyAmount(e.target.value)}
                                                pr="10"
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
                                                onChange={(e) => setBuyTotal(e.target.value)}
                                                pr="12"
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
                                    </Box>

                                    <Button colorScheme="green" size="sm" mt={2}>
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
                                                onChange={(e) => setSellPrice(e.target.value)}
                                                pr="12"
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
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1} color="fg.muted">Amount</Text>
                                        <Box position="relative">
                                            <Input
                                                size="sm"
                                                placeholder="0.00000"
                                                value={sellAmount}
                                                onChange={(e) => setSellAmount(e.target.value)}
                                                pr="10"
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
                                                onChange={(e) => setSellTotal(e.target.value)}
                                                pr="12"
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
                                    </Box>

                                    <Button colorScheme="red" size="sm" mt={2}>
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
                                    <Table.Header position="sticky" top={0} bg="bg.panel" zIndex={1}>
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
                                        <Table.Header position="sticky" top={0} bg="bg.panel" zIndex={1}>
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