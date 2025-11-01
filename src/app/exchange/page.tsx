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
    Spacer, Skeleton,
} from '@chakra-ui/react'
import { LuSearch, LuTrendingUp, LuTrendingDown, LuArrowRight } from 'react-icons/lu'
import {useCallback, useMemo, useState} from 'react'
import NextLink from "next/link";
import {useRouter} from "next/navigation";
import {TokenLogo} from "@/components/ui/token_logo";
import {ListingTitle} from "@/components/ui/listing/title";
import {useMarkets} from "@/hooks/useMarkets";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {createMarketId} from "@/utils/market";
import {useAssetsValue} from "@/hooks/useAssetsValue";
import {MarketSDKType} from "@bze/bzejs/bze/tradebin/store";
import {MarketData} from "@/types/market";
import {prettyAmount, uPriceToBigNumberPrice} from "@/utils/amount";
import {useAssetPrice} from "@/hooks/usePrices";
import BigNumber from "bignumber.js";

// Mock data for market pairs
// const mockMarkets = [
//     {
//         id: 1,
//         baseAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/bze_alternative_512x512.png' },
//         quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/bze_alternative_512x512.png' },
//         verified: true,
//         price: 0.125,
//         priceChange24h: 5.67,
//         volume24h: 245678.90,
//         volumeUSD: 245678.90,
//     },
//     {
//         id: 2,
//         baseAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/token_placeholder.png' },
//         quoteAsset: { symbol: 'BTC', name: 'Bitcoin', logo: '/images/bze_alternative_512x512.png' },
//         verified: true,
//         price: 0.00000298,
//         priceChange24h: -2.43,
//         volume24h: 12.45,
//         volumeUSD: 1245678.90,
//     },
//     {
//         id: 3,
//         baseAsset: { symbol: 'ETH', name: 'Ethereum', logo: '/images/logo_320px.png' },
//         quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/token.svg' },
//         verified: true,
//         price: 2456.78,
//         priceChange24h: 3.21,
//         volume24h: 8765432.10,
//         volumeUSD: 8765432.10,
//     },
//     {
//         id: 4,
//         baseAsset: { symbol: 'ATOM', name: 'Cosmos', logo: '/images/token.svg' },
//         quoteAsset: { symbol: 'USDC', name: 'USD Coin', logo: '/images/bze_alternative_512x512.png' },
//         verified: false,
//         price: 8.45,
//         priceChange24h: -1.23,
//         volume24h: 567890.12,
//         volumeUSD: 567890.12,
//     },
//     {
//         id: 5,
//         baseAsset: { symbol: 'OSMO', name: 'Osmosis', logo: '/images/token.svg' },
//         quoteAsset: { symbol: 'BZE', name: 'BeeZee', logo: '/images/logo_320px.png' },
//         verified: true,
//         price: 15.67,
//         priceChange24h: 8.91,
//         volume24h: 234567.89,
//         volumeUSD: 1567890.23,
//     },
// ]

interface MarketRowProps {
    market: MarketSDKType
    marketData?: MarketData
    onClick?: () => void
}

const MarketRow = ({ market, marketData, onClick }: MarketRowProps) => {
    const {asset: baseAsset} = useAsset(market.base)
    const {asset: quoteAsset} = useAsset(market.quote)
    const {totalUsdValue: quoteUsdValue, isUSDC: quoteIsUSDC} = useAssetPrice(market.quote)

    const displayPrice = useMemo(() => {
        return uPriceToBigNumberPrice(marketData?.last_price || 0, quoteAsset?.decimals || 0, baseAsset?.decimals || 0).toString()
    }, [baseAsset, quoteAsset, marketData])

    const displayVolume = useMemo(() => {
        return marketData?.quote_volume || 0
    }, [marketData])

    const isVerifiedMarket = useMemo(() => {
        return !!baseAsset?.verified && !!quoteAsset?.verified;
    }, [baseAsset, quoteAsset])

    const isPositive = useMemo(() => {
        if (!marketData) return false;

        return marketData.change > 0;
    }, [marketData])

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
                    <HStack>
                        <TokenLogo
                            src={baseAsset?.logo}
                            symbol={baseAsset?.ticker || market.base}
                            size="8"
                            circular={true}
                        />
                        <Box
                            ml={-1}
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                        >
                            <TokenLogo
                                src={quoteAsset?.logo}
                                symbol={quoteAsset?.ticker || market.quote}
                                size="8"
                                circular={true}
                            />
                        </Box>
                    </HStack>
                    <VStack align="start" gap={0}>
                        <HStack>
                            <Text fontWeight="bold" fontSize="md">
                                {baseAsset?.ticker}/{quoteAsset?.ticker}
                            </Text>
                            <Badge
                                variant="subtle" colorPalette={isVerifiedMarket? 'blue' : 'gray'}
                                fontSize="xs"
                            >
                                {isVerifiedMarket ? '✓ Verified' : ''}
                            </Badge>
                        </HStack>
                        <Text fontSize="xs" color="fg.muted">
                            {baseAsset?.name} / {quoteAsset?.name}
                        </Text>
                    </VStack>
                </HStack>

                {/* Price */}
                <VStack align="end" gap={0}>
                    <Text fontWeight="semibold">
                        {displayPrice} {quoteAsset?.ticker}
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
                            {isPositive ? '+' : ''}{marketData?.change.toFixed(2) || 0}%
                        </Text>
                    </HStack>
                </VStack>

                {/* Volume */}
                <VStack align="end" gap={0}>
                    <Text fontWeight="medium">
                        {prettyAmount(displayVolume)} {quoteAsset?.ticker}
                    </Text>
                    {!quoteIsUSDC && (
                        <Text fontSize="sm" color="fg.muted">
                            ${quoteUsdValue(new BigNumber(displayVolume)).toString()}
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
                        <HStack>
                            <TokenLogo
                                src={baseAsset?.logo}
                                symbol={baseAsset?.ticker || market.base}
                                size="8"
                                circular={true}
                            />
                            <Box
                                ml={-1}
                                alignItems="center"
                                justifyContent="center"
                                position="relative"
                            >
                                <TokenLogo
                                    src={quoteAsset?.logo}
                                    symbol={quoteAsset?.ticker || market.quote}
                                    size="8"
                                    circular={true}
                                />
                            </Box>
                        </HStack>
                        <VStack align="start" gap={0}>
                            <HStack gap={1}>
                                <Text fontWeight="bold" fontSize="sm">
                                    {baseAsset?.ticker}/{quoteAsset?.ticker}
                                </Text>
                                <Badge
                                    variant="subtle" colorPalette={isVerifiedMarket ? 'blue' : 'gray'}
                                    fontSize="10px"
                                    px={1}
                                    py={0.5}
                                >
                                    {isVerifiedMarket ? '✓' : 'U'}
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
                            {displayPrice} {quoteAsset?.ticker}
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
                                {isPositive ? '+' : ''}{marketData?.change.toFixed(2) || 0}%
                            </Text>
                        </HStack>
                    </Box>

                    <Box>
                        <Text fontSize="xs" color="fg.muted" mb={1}>
                            24h Volume
                        </Text>
                        <Text fontWeight="medium" fontSize="sm">
                            {prettyAmount(displayVolume)} {quoteAsset?.ticker}
                        </Text>
                        {!quoteIsUSDC && (
                            <Text fontSize="xs" color="fg.muted">
                                ${quoteUsdValue(new BigNumber(displayVolume)).toString()}
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
    const {markets, getMarketData, isLoading: isLoadingMarkets} = useMarkets()
    const {isVerifiedAsset, denomTicker} = useAssets()
    const {compareValues} = useAssetsValue()

    const sortedMarkets = useMemo(() => {
        if (!markets) return [];

        return markets
            .sort((a, b) => {
                const aData = getMarketData(createMarketId(a.base, a.quote))
                const bData = getMarketData(createMarketId(b.base, b.quote))
                if (!aData && bData) return 1;
                if (aData && !bData) return -1;

                const aVerified = isVerifiedAsset(a.base) && isVerifiedAsset(a.quote)
                const bVerified = isVerifiedAsset(b.base) && isVerifiedAsset(b.quote)
                if (!aVerified && bVerified) return 1;
                if (aVerified && !bVerified) return -1;
                if (!aData && !bData) return 0;

                const aVolume = {
                    amount: new BigNumber(aData?.quote_volume || 0),
                    denom: a.quote
                }

                const bVolume = {
                    amount: new BigNumber(bData?.quote_volume || 0),
                    denom: b.quote
                }

                return compareValues(aVolume, bVolume)
            })
    }, [markets, isVerifiedAsset, getMarketData, compareValues])

    const filteredMarkets = useMemo(() => {
        if (!sortedMarkets) return [];

        return sortedMarkets
            .filter(market =>
                denomTicker(market.base).toLowerCase().includes(searchTerm.toLowerCase()) ||
                denomTicker(market.quote).toLowerCase().includes(searchTerm.toLowerCase())
            )
    }, [sortedMarkets, searchTerm, denomTicker])

    const handleMarketClick = useCallback((market: MarketSDKType) => {
        router.push(`/exchange/market?market_id=${createMarketId(market.base, market.quote)}`)

    }, [router])

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
                <Skeleton asChild loading={isLoadingMarkets}>
                    <VStack gap={2} align="stretch">
                        {filteredMarkets.map((market) => (
                            <MarketRow
                                key={market.base + market.quote}
                                market={market}
                                marketData={getMarketData(createMarketId(market.base, market.quote))}
                                onClick={() => handleMarketClick(market)}
                            />
                        ))}
                    </VStack>
                </Skeleton>

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