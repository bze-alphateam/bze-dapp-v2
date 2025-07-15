'use client'

import {
    Box,
    Container,
    Heading,
    HStack,
    VStack,
    Text,
    Badge,
    Button,
    Input,
    SimpleGrid,
    Spacer,
    Image,
} from '@chakra-ui/react'
import { useColorModeValue } from '@/components/ui/color-mode'
import { LuSearch, LuTrendingUp, LuTrendingDown, LuArrowRight } from 'react-icons/lu'
import { useState } from 'react'

// Mock data for market pairs
const mockMarkets = [
    {
        id: 1,
        baseAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/bze_alternative_512x512.png' },
        quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/bze_alternative_512x512.png' },
        verified: true,
        price: 0.125,
        priceChange24h: 5.67,
        volume24h: 245678.90,
        volumeUSD: 245678.90,
    },
    {
        id: 2,
        baseAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/logo_320px.png' },
        quoteAsset: { symbol: 'BTC', name: 'Bitcoin', logo: '/images/bze_alternative_512x512.png' },
        verified: true,
        price: 0.00000298,
        priceChange24h: -2.43,
        volume24h: 12.45,
        volumeUSD: 1245678.90,
    },
    {
        id: 3,
        baseAsset: { symbol: 'ETH', name: 'Ethereum', logo: '/images/logo_320px.png' },
        quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/logo_320px.png' },
        verified: true,
        price: 2456.78,
        priceChange24h: 3.21,
        volume24h: 8765432.10,
        volumeUSD: 8765432.10,
    },
    {
        id: 4,
        baseAsset: { symbol: 'ATOM', name: 'Cosmos', logo: '/images/logo_320px.png' },
        quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/bze_alternative_512x512.png' },
        verified: false,
        price: 8.45,
        priceChange24h: -1.23,
        volume24h: 567890.12,
        volumeUSD: 567890.12,
    },
    {
        id: 5,
        baseAsset: { symbol: 'OSMO', name: 'Osmosis', logo: '/images/bze_alternative_512x512.png' },
        quoteAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/logo_320px.png' },
        verified: true,
        price: 15.67,
        priceChange24h: 8.91,
        volume24h: 234567.89,
        volumeUSD: 1567890.23,
    },
]

interface MarketRowProps {
    market: typeof mockMarkets[0]
    onClick: () => void
}

const MarketRow = ({ market, onClick }: MarketRowProps) => {
    const hoverBg = useColorModeValue('gray.50', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.700')

    const formatPrice = (price: number) => {
        if (price < 0.001) return price.toExponential(3)
        if (price < 1) return price.toFixed(6)
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const formatVolume = (volume: number) => {
        if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
        if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
        if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
        return volume.toFixed(2)
    }

    const isPositive = market.priceChange24h > 0

    return (
        <Box
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
                bg: hoverBg,
                transform: 'translateY(-1px)',
                borderColor: 'colorPalette.300',
            }}
            onClick={onClick}
        >
            {/* Desktop View */}
            <SimpleGrid
                columns={{ base: 1, md: 4 }}
                gap={4}
                alignItems="center"
                hideBelow="md"
            >
                {/* Asset Pair */}
                <HStack gap={3}>
                    <HStack gap={-2}>
                        <Box
                            position="relative"
                            w="8"
                            h="8"
                            borderRadius="full"
                            overflow="hidden"
                            border="2px solid"
                            borderColor="bg"
                        >
                            <Image
                                src={market.baseAsset.logo}
                                alt={market.baseAsset.symbol}
                                w="full"
                                h="full"
                                objectFit="cover"
                                fallback={
                                    <Box
                                        w="full"
                                        h="full"
                                        bg="gray.200"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        {market.baseAsset.symbol.charAt(0)}
                                    </Box>
                                }
                            />
                        </Box>
                        <Box
                            position="relative"
                            w="8"
                            h="8"
                            borderRadius="full"
                            overflow="hidden"
                            border="2px solid"
                            borderColor="bg"
                            ml="-2"
                        >
                            <Image
                                src={market.quoteAsset.logo}
                                alt={market.quoteAsset.symbol}
                                w="full"
                                h="full"
                                objectFit="cover"
                                fallback={
                                    <Box
                                        w="full"
                                        h="full"
                                        bg="gray.200"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        {market.quoteAsset.symbol.charAt(0)}
                                    </Box>
                                }
                            />
                        </Box>
                    </HStack>
                    <VStack align="start" gap={0}>
                        <HStack>
                            <Text fontWeight="bold" fontSize="md">
                                {market.baseAsset.symbol}/{market.quoteAsset.symbol}
                            </Text>
                            <Badge
                                variant="subtle" colorPalette={market.verified ? 'blue' : 'gray'}
                                fontSize="xs"
                            >
                                {market.verified ? '✓ Verified' : 'Unverified'}
                            </Badge>
                        </HStack>
                        <Text fontSize="xs" color="fg.muted">
                            {market.baseAsset.name} / {market.quoteAsset.name}
                        </Text>
                    </VStack>
                </HStack>

                {/* Price */}
                <VStack align="end" gap={0}>
                    <Text fontWeight="semibold">
                        {formatPrice(market.price)} {market.quoteAsset.symbol}
                    </Text>
                    <HStack gap={1}>
                        {isPositive ? (
                            <LuTrendingUp size={12} color="green" />
                        ) : (
                            <LuTrendingDown size={12} color="red" />
                        )}
                        <Text
                            fontSize="sm"
                            color={isPositive ? 'green.500' : 'red.500'}
                            fontWeight="medium"
                        >
                            {isPositive ? '+' : ''}{market.priceChange24h.toFixed(2)}%
                        </Text>
                    </HStack>
                </VStack>

                {/* Volume */}
                <VStack align="end" gap={0}>
                    <Text fontWeight="medium">
                        {formatVolume(market.volume24h)} {market.quoteAsset.symbol}
                    </Text>
                    {market.quoteAsset.symbol !== 'USDC' && (
                        <Text fontSize="sm" color="fg.muted">
                            ${formatVolume(market.volumeUSD)}
                        </Text>
                    )}
                </VStack>

                {/* Trade Button */}
                <Box textAlign="right">
                    <Button
                        size="sm"
                        variant="solid"
                        minW="80px"
                    >
                        Trade <LuArrowRight />
                    </Button>
                </Box>
            </SimpleGrid>

            {/* Mobile View */}
            <VStack align="stretch" gap={3} hideFrom="md">
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <HStack gap={-1}>
                            <Box
                                position="relative"
                                w="6"
                                h="6"
                                borderRadius="full"
                                overflow="hidden"
                                border="1px solid"
                                borderColor="bg"
                            >
                                <Image
                                    src={market.baseAsset.logo}
                                    alt={market.baseAsset.symbol}
                                    w="full"
                                    h="full"
                                    objectFit="cover"
                                    fallback={
                                        <Box
                                            w="full"
                                            h="full"
                                            bg="gray.200"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            fontSize="10px"
                                            fontWeight="bold"
                                        >
                                            {market.baseAsset.symbol.charAt(0)}
                                        </Box>
                                    }
                                />
                            </Box>
                            <Box
                                position="relative"
                                w="6"
                                h="6"
                                borderRadius="full"
                                overflow="hidden"
                                border="1px solid"
                                borderColor="bg"
                                ml="-1"
                            >
                                <Image
                                    src={market.quoteAsset.logo}
                                    alt={market.quoteAsset.symbol}
                                    w="full"
                                    h="full"
                                    objectFit="cover"
                                    fallback={
                                        <Box
                                            w="full"
                                            h="full"
                                            bg="gray.200"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            fontSize="10px"
                                            fontWeight="bold"
                                        >
                                            {market.quoteAsset.symbol.charAt(0)}
                                        </Box>
                                    }
                                />
                            </Box>
                        </HStack>
                        <VStack align="start" gap={0}>
                            <HStack gap={1}>
                                <Text fontWeight="bold" fontSize="sm">
                                    {market.baseAsset.symbol}/{market.quoteAsset.symbol}
                                </Text>
                                <Badge
                                    variant="subtle" colorPalette={market.verified ? 'blue' : 'gray'}
                                    fontSize="10px"
                                    px={1}
                                    py={0.5}
                                >
                                    {market.verified ? '✓' : 'U'}
                                </Badge>
                            </HStack>
                        </VStack>
                    </HStack>
                    <Button size="xs" variant="solid">
                        Trade
                    </Button>
                </HStack>

                <SimpleGrid columns={2} gap={4}>
                    <Box>
                        <Text fontSize="xs" color="fg.muted" mb={1}>
                            24h Price
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                            {formatPrice(market.price)} {market.quoteAsset.symbol}
                        </Text>
                        <HStack gap={1}>
                            {isPositive ? (
                                <LuTrendingUp size={10} color="green" />
                            ) : (
                                <LuTrendingDown size={10} color="red" />
                            )}
                            <Text
                                fontSize="xs"
                                color={isPositive ? 'green.500' : 'red.500'}
                                fontWeight="medium"
                            >
                                {isPositive ? '+' : ''}{market.priceChange24h.toFixed(2)}%
                            </Text>
                        </HStack>
                    </Box>

                    <Box>
                        <Text fontSize="xs" color="fg.muted" mb={1}>
                            24h Volume
                        </Text>
                        <Text fontWeight="medium" fontSize="sm">
                            {formatVolume(market.volume24h)} {market.quoteAsset.symbol}
                        </Text>
                        {market.quoteAsset.symbol !== 'USDC' && (
                            <Text fontSize="xs" color="fg.muted">
                                ${formatVolume(market.volumeUSD)}
                            </Text>
                        )}
                    </Box>
                </SimpleGrid>
            </VStack>
        </Box>
    )
}

export default function ExchangePage() {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredMarkets = mockMarkets.filter(market =>
        `${market.baseAsset.symbol}/${market.quoteAsset.symbol}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        market.baseAsset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.quoteAsset.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleMarketClick = (market: typeof mockMarkets[0]) => {
        console.log('Navigate to trading pair:', `${market.baseAsset.symbol}/${market.quoteAsset.symbol}`)
        // Here you would navigate to the specific trading pair page
    }

    return (
        <Container maxW="7xl" py={8}>
            <VStack gap={6} align="stretch">
                {/* Header */}
                <VStack gap={4} align="start">
                    <Heading size="xl">Exchange Markets</Heading>
                </VStack>

                {/* Search and Filters */}
                <HStack gap={4}>
                    <Box position="relative" maxW="400px">
                        <Input
                            placeholder="Search markets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            pl="10"
                        />
                        <Box
                            position="absolute"
                            left="3"
                            top="50%"
                            transform="translateY(-50%)"
                            color="fg.muted"
                        >
                            <LuSearch size={18} />
                        </Box>
                    </Box>
                    <Spacer />
                    <HStack gap={2}>
                        <Badge variant="outline" fontSize="sm" px={3} py={1}>
                            {filteredMarkets.length} pairs
                        </Badge>
                    </HStack>
                </HStack>

                {/* Market List Header - Desktop Only */}
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} px={4} py={2} hideBelow="md">
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                        Market
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted" textAlign="right">
                        24h Price
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted" textAlign="right">
                        24h Volume
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted" textAlign="right">
                        Action
                    </Text>
                </SimpleGrid>

                {/* Market List */}
                <VStack gap={2} align="stretch">
                    {filteredMarkets.map((market) => (
                        <MarketRow
                            key={market.id}
                            market={market}
                            onClick={() => handleMarketClick(market)}
                        />
                    ))}
                </VStack>

                {filteredMarkets.length === 0 && (
                    <Box textAlign="center" py={12}>
                        <Text color="fg.muted" fontSize="lg">
                            No markets found matching &#34;{searchTerm}&#34;
                        </Text>
                    </Box>
                )}
            </VStack>
        </Container>
    )
}