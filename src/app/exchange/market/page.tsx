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
} from '@chakra-ui/react';
import { LuTrendingUp, LuTrendingDown, LuActivity, LuChartBar, LuArrowLeft } from 'react-icons/lu';
import {useNavigationWithParams} from "@/hooks/useNavigation";
import {useMarket} from "@/hooks/useMarkets";
import {useAsset} from "@/hooks/useAssets";
import {prettyAmount, uAmountToAmount, uPriceToPrice} from "@/utils/amount";
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
import {intlDateFormat} from "@/utils/formatter";


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

    const {marketIdParam, toExchangePage} = useNavigationWithParams();

    const {marketData, market} = useMarket(marketIdParam ?? '')
    const {asset: baseAsset} = useAsset(market?.base ?? '')
    const {asset: quoteAsset} = useAsset(market?.quote ?? '')
    const {address} = useChain(getChainName())

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

    const formattedDateFromTimestamp = useCallback((timestamp: string) => {
        return intlDateFormat.format(new Date(parseInt(timestamp) * 1000))
    }, [])

    const dailyVolume = useMemo(() => {
        if (!marketData) return '0';

        return prettyAmount(marketData.quote_volume)
    }, [marketData])

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
                                <Text fontSize="2xl" fontWeight="bold" color={priceColor}>
                                    {marketData?.last_price} {quoteAsset?.ticker}
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack gap={6} display={{ base: 'none', lg: 'flex' }}>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                                <Text fontSize="sm" fontWeight="medium">{dailyVolume} {quoteAsset?.ticker}</Text>
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h High</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.high || 0}</Text>
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Low</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData?.low || 0}</Text>
                            </VStack>
                        </HStack>
                    </Flex>
                </Box>

                {/* Main Trading Layout */}
                <Grid templateColumns={{ base: '1fr', lg: '280px 1fr 280px' }} gap={4}>
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
                                <Text fontWeight="bold" mb={3} color="green.500" fontSize="sm">Buy BZE</Text>
                                <VStack gap={2} align="stretch">
                                    <Box>
                                        <Text fontSize="xs" mb={1}>Price</Text>
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
                                                USDC
                                            </Text>
                                        </Box>
                                        {buyPrice && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                {/*{calculateUSDValue(buyPrice, 'USDC')}*/}
                                                1.232
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1}>Amount</Text>
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
                                                BZE
                                            </Text>
                                        </Box>
                                        {buyAmount && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                {/*{calculateUSDValue(buyAmount, 'BZE')}*/}
                                                3.21
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1}>Total</Text>
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
                                                USDC
                                            </Text>
                                        </Box>
                                        {buyTotal && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                4.12
                                            </Text>
                                        )}
                                    </Box>

                                    <Button colorScheme="green" size="sm" mt={2}>
                                        Buy BZE
                                    </Button>
                                </VStack>
                            </Box>

                            {/* Sell Form */}
                            <Box p={3} bg="bg.panel" borderRadius="md" borderWidth="1px">
                                <Text fontWeight="bold" mb={3} color="red.500" fontSize="sm">Sell BZE</Text>
                                <VStack gap={2} align="stretch">
                                    <Box>
                                        <Text fontSize="xs" mb={1}>Price</Text>
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
                                                USDC
                                            </Text>
                                        </Box>
                                        {sellPrice && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                4.2
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1}>Amount</Text>
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
                                                BZE
                                            </Text>
                                        </Box>
                                        {sellAmount && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                33
                                            </Text>
                                        )}
                                    </Box>

                                    <Box>
                                        <Text fontSize="xs" mb={1}>Total</Text>
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
                                                USDC
                                            </Text>
                                        </Box>
                                        {sellTotal && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                32
                                            </Text>
                                        )}
                                    </Box>

                                    <Button colorScheme="red" size="sm" mt={2}>
                                        Sell BZE
                                    </Button>
                                </VStack>
                            </Box>
                        </Grid>
                    </VStack>

                    {/* Right: Market History/My History */}
                    <VStack gap={4} align="stretch">
                        <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                            <HStack mb={3}>
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

                            <VStack gap={0} align="stretch">
                                {/* Sticky Header */}
                                <HStack justify="space-between" mb={2} py={1} bg="bg.panel" position="sticky" top={0}>
                                    <Text fontSize="xs" color="fg.muted">Price ({quoteAsset?.ticker})</Text>
                                    <Text fontSize="xs" color="fg.muted">Amount ({baseAsset?.ticker})</Text>
                                    <Text fontSize="xs" color="fg.muted">Time</Text>
                                </HStack>

                                {/* Scrollable Content */}
                                <Box maxH="200px" overflowY="auto" css={{
                                    '&::-webkit-scrollbar': {
                                        width: '4px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: 'gray',
                                        borderRadius: '24px',
                                    },
                                }}>
                                    {historyTab === 'market' && historyOrders.map((trade, i) => (
                                        <HStack key={i} justify="space-between" fontSize="xs" py={2}>
                                            <Text color={orderTypeColor(trade.order_type)}>
                                                {uPriceToPrice(trade.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)}
                                            </Text>
                                            <Text>{uAmountToAmount(trade.amount, baseAsset?.decimals || 0)}</Text>
                                            <Text color="fg.muted">{formattedDateFromTimestamp(trade.executed_at.toString())}</Text>
                                        </HStack>
                                    ))}
                                    {historyTab === 'my' && myHistory.map((trade, i) => (
                                        <HStack key={i} justify="space-between" fontSize="xs" py={2}>
                                            <Text color={orderTypeColor(trade.order_type)}>
                                                {trade.price}
                                            </Text>
                                            <Text>{trade.base_volume}</Text>
                                            <Text color="fg.muted">{trade.executed_at}</Text>
                                        </HStack>
                                    ))}
                                </Box>
                            </VStack>
                        </Box>

                        {/* Active Orders */}
                        <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                            <HStack justify="space-between" mb={3}>
                                <Text fontWeight="bold" fontSize="sm">Active Orders</Text>
                                <Button size="xs" variant="ghost">Cancel All</Button>
                            </HStack>
                            <VStack gap={2} align="stretch">
                                {myOrders.map((order, i) => (
                                    <HStack key={i} justify="space-between" p={2} bg="bg.muted" borderRadius="sm">
                                        {/*<VStack align="start" gap={0}>*/}
                                        <Badge color={orderTypeColor(order.order_type)} size="sm">
                                            {order.order_type.toUpperCase()}
                                        </Badge>
                                        <Text fontSize="xs">{uAmountToAmount(order.amount, baseAsset?.decimals || 0)}</Text>
                                        {/*</VStack>*/}
                                        {/*<VStack align="end" gap={0}>*/}
                                        <Text fontSize="xs" fontWeight="medium">{uPriceToPrice(order.price, quoteAsset?.decimals || 0, baseAsset?.decimals || 0)}</Text>
                                        <Button size="xs" variant="ghost" colorScheme="red">
                                            Cancel
                                        </Button>
                                        {/*</VStack>*/}
                                    </HStack>
                                ))}
                            </VStack>
                        </Box>

                        {/* Balance */}
                        <Box p={4} bg="bg.panel" borderRadius="md" borderWidth="1px">
                            <Text fontWeight="bold" mb={3} fontSize="sm">Balance</Text>
                            <VStack align="stretch" gap={2}>
                                <HStack justify="space-between">
                                    <Text fontSize="xs">BZE</Text>
                                    <Text fontSize="xs" fontWeight="medium">260,000.07</Text>
                                </HStack>
                                <HStack justify="space-between">
                                    <Text fontSize="xs">USDC</Text>
                                    <Text fontSize="xs" fontWeight="medium">1,234.56</Text>
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