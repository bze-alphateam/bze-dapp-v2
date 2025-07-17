"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const TradingPage = () => {
    const router = useRouter();
    const [historyTab, setHistoryTab] = useState('market');
    const [timeframe, setTimeframe] = useState('1D');

    // Form state
    const [buyPrice, setBuyPrice] = useState('');
    const [buyAmount, setBuyAmount] = useState('');
    const [buyTotal, setBuyTotal] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [sellTotal, setSellTotal] = useState('');

    // Calculate USD approximations
    const calculateUSDValue = (value: string, type: 'USDC' | 'BZE') => {
        if (!value || isNaN(Number(value))) return '';
        const numValue = Number(value);
        if (type === 'USDC') {
            return `≈ ${numValue.toFixed(2)}`;
        } else {
            // For BZE, multiply by current price to get USD value
            const usdValue = numValue * Number(marketData.price);
            return `≈ ${usdValue.toFixed(4)}`;
        }
    };

    // Mock data
    const marketData = {
        pair: 'BZE/USDC',
        price: '0.00116',
        change: '-2.52%',
        volume24h: '2,213,106.81 BZE',
        high24h: '0.00123',
        low24h: '0.00111',
        isNegative: true
    };

    const orderBookData = {
        bids: [
            { price: '0.00115', amount: '548.93' },
            { price: '0.00114', amount: '1145.49' },
            { price: '0.00113', amount: '758.56' },
            { price: '0.00112', amount: '393.38' },
            { price: '0.00111', amount: '530.38' },
        ],
        asks: [
            { price: '0.00119', amount: '1368.64' },
            { price: '0.00118', amount: '509.86' },
            { price: '0.00117', amount: '976.58' },
            { price: '0.00116', amount: '836.15' },
        ]
    };

    const tradeHistory = [
        { type: 'sell', price: '0.00116', amount: '235.87', time: '01:58' },
        { type: 'sell', price: '0.00116', amount: '524.48', time: '01:57' },
        { type: 'sell', price: '0.00117', amount: '268.43', time: '01:54' },
        { type: 'buy', price: '0.00117', amount: '572.60', time: '01:54' },
        { type: 'sell', price: '0.00118', amount: '814.93', time: '01:51' },
        { type: 'buy', price: '0.00112', amount: '6.85', time: '01:40' },
    ];

    const myOrders = [
        { type: 'sell', price: '0.003', amount: '40000' },
        { type: 'sell', price: '0.002', amount: '10000' },
        { type: 'buy', price: '0.0009', amount: '246.97' },
    ];

    const myHistory = [
        { type: 'sell', price: '0.00116', amount: '235.87', time: '07/17/25 01:58' },
        { type: 'buy', price: '0.00112', amount: '752.41', time: '07/17/25 01:40' },
        { type: 'sell', price: '0.00117', amount: '268.43', time: '07/17/25 01:39' },
    ];

    const timeframes = ['4H', '1D', '7D', '30D', '1Y'];

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
                                onClick={() => router.push('/exchange')}
                            >
                                <LuArrowLeft />Markets
                            </Button>
                            <Box h="4" w="1px" bg="border" />
                            <VStack align="start" gap={1}>
                                <HStack>
                                    <Text fontSize="xl" fontWeight="bold">{marketData.pair}</Text>
                                    <Badge colorScheme={marketData.isNegative ? 'red' : 'green'} variant="subtle">
                                        {marketData.change}
                                    </Badge>
                                </HStack>
                                <Text fontSize="2xl" fontWeight="bold" color={marketData.isNegative ? 'red.500' : 'green.500'}>
                                    {marketData.price} USDC
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack gap={6} display={{ base: 'none', lg: 'flex' }}>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData.volume24h}</Text>
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h High</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData.high24h}</Text>
                            </VStack>
                            <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="fg.muted">24h Low</Text>
                                <Text fontSize="sm" fontWeight="medium">{marketData.low24h}</Text>
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
                                    <Text fontSize="xs" color="fg.muted">Price</Text>
                                    <Text fontSize="xs" color="fg.muted">Amount</Text>
                                </HStack>
                                {orderBookData.asks.reverse().map((ask, i) => (
                                    <HStack key={i} justify="space-between" fontSize="xs" py={1}>
                                        <Text color="red.500">{ask.price}</Text>
                                        <Text>{ask.amount}</Text>
                                    </HStack>
                                ))}
                            </Box>

                            {/* Current Price */}
                            <Box py={2} bg="bg.muted" borderRadius="sm">
                                <HStack justify="center">
                                    <Text fontSize="md" fontWeight="bold" color={marketData.isNegative ? 'red.500' : 'green.500'}>
                                        {marketData.price}
                                    </Text>
                                    {marketData.isNegative ? (
                                        <LuTrendingDown color="red" size={16} />
                                    ) : (
                                        <LuTrendingUp color="green" size={16} />
                                    )}
                                </HStack>
                            </Box>

                            {/* Bids */}
                            <Box>
                                {orderBookData.bids.map((bid, i) => (
                                    <HStack key={i} justify="space-between" fontSize="xs" py={1}>
                                        <Text color="green.500">{bid.price}</Text>
                                        <Text>{bid.amount}</Text>
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
                                                {calculateUSDValue(buyPrice, 'USDC')}
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
                                                {calculateUSDValue(buyAmount, 'BZE')}
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
                                                {calculateUSDValue(buyTotal, 'USDC')}
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
                                                {calculateUSDValue(sellPrice, 'USDC')}
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
                                                {calculateUSDValue(sellAmount, 'BZE')}
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
                                                {calculateUSDValue(sellTotal, 'USDC')}
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
                                <HStack justify="space-between" mb={2} py={1} bg="bg.panel" position="sticky" top={0} zIndex={1}>
                                    <Text fontSize="xs" color="fg.muted">Price</Text>
                                    <Text fontSize="xs" color="fg.muted">Amount</Text>
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
                                    {(historyTab === 'market' ? tradeHistory.slice(0, 10) : myHistory.slice(0, 10)).map((trade, i) => (
                                        <HStack key={i} justify="space-between" fontSize="xs" py={2}>
                                            <Text color={trade.type === 'buy' ? 'green.500' : 'red.500'}>
                                                {trade.price}
                                            </Text>
                                            <Text>{trade.amount}</Text>
                                            <Text color="fg.muted">{trade.time}</Text>
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
                                        <VStack align="start" gap={0}>
                                            <Badge colorScheme={order.type === 'buy' ? 'green' : 'red'} size="sm">
                                                {order.type.toUpperCase()}
                                            </Badge>
                                            <Text fontSize="xs">{order.amount}</Text>
                                        </VStack>
                                        <VStack align="end" gap={0}>
                                            <Text fontSize="xs" fontWeight="medium">{order.price}</Text>
                                            <Button size="xs" variant="ghost" colorScheme="red">
                                                Cancel
                                            </Button>
                                        </VStack>
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