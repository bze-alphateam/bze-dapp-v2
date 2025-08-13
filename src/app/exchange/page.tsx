'use client'

import {
    Box,
    Container,
    HStack,
    VStack,
    Text,
    Badge,
    Button,
    Input,
    SimpleGrid,
    Spacer,
} from '@chakra-ui/react'
import { LuSearch, LuTrendingUp, LuTrendingDown, LuArrowRight } from 'react-icons/lu'
import { useState } from 'react'
import NextLink from "next/link";
import {useRouter} from "next/navigation";
import {TokenLogo} from "@/components/ui/token_logo";
import {ListingTitle} from "@/components/ui/listing/title";

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
        baseAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/token_placeholder.png' },
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
        quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/token.svg' },
        verified: true,
        price: 2456.78,
        priceChange24h: 3.21,
        volume24h: 8765432.10,
        volumeUSD: 8765432.10,
    },
    {
        id: 4,
        baseAsset: { symbol: 'ATOM', name: 'Cosmos', logo: '/images/token.svg' },
        quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/bze_alternative_512x512.png' },
        verified: false,
        price: 8.45,
        priceChange24h: -1.23,
        volume24h: 567890.12,
        volumeUSD: 567890.12,
    },
    {
        id: 5,
        baseAsset: { symbol: 'OSMO', name: 'Osmosis', logo: '/images/token.svg' },
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
            borderColor="border.subtle"
            borderRadius="lg"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
                bg: "bg.muted"
            }}
            onClick={onClick}
            bg="bg.surface"
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
                        <TokenLogo
                            src={market.baseAsset.logo}
                            symbol={market.baseAsset.symbol}
                            size="8"
                            circular={true}
                        />
                        <Box
                            ml={-2}
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                        >
                            <TokenLogo
                                src={market.quoteAsset.logo}
                                symbol={market.quoteAsset.symbol}
                                size="8"
                                circular={true}
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
                <NextLink href="/exchange/market">
                    <Box textAlign="right">
                        <Button
                            size="sm"
                            variant="solid"
                            minW="80px"
                        >
                            Trade <LuArrowRight />
                        </Button>
                    </Box>
                </NextLink>
            </SimpleGrid>

            {/* Mobile View */}
            <VStack align="stretch" gap={3} hideFrom="md">
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <HStack gap={-1}>
                            <TokenLogo
                                src={market.baseAsset.logo}
                                symbol={market.baseAsset.symbol}
                                size="8"
                                circular={true}
                            />
                            <Box
                                ml={-2}
                                alignItems="center"
                                justifyContent="center"
                                position="relative"
                            >
                                <TokenLogo
                                    src={market.quoteAsset.logo}
                                    symbol={market.quoteAsset.symbol}
                                    size="8"
                                    circular={true}
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
    const router = useRouter();

    const filteredMarkets = mockMarkets.filter(market =>
        `${market.baseAsset.symbol}/${market.quoteAsset.symbol}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
        market.baseAsset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.quoteAsset.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleMarketClick = (market: typeof mockMarkets[0]) => {
        router.push(`/exchange/market?market_id=${market.id}`)
    }

    return (
        <Container maxW="7xl" py={8}>
            <VStack gap={6} align="stretch">
                {/* Header */}
                <ListingTitle title={"Exchange Markets"} />

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