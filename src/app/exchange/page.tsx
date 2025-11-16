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
    Skeleton,
} from '@chakra-ui/react'
import { LuSearch, LuTrendingUp, LuTrendingDown, LuArrowRight } from 'react-icons/lu'
import {useCallback, useMemo, useState} from 'react'
import NextLink from "next/link";
import {LPTokenLogo} from "@/components/ui/lp_token_logo";
import {useMarkets} from "@/hooks/useMarkets";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {createMarketId} from "@/utils/market";
import {useAssetsValue} from "@/hooks/useAssetsValue";
import {MarketSDKType} from "@bze/bzejs/bze/tradebin/store";
import {MarketData} from "@/types/market";
import {prettyAmount} from "@/utils/amount";
import {useAssetPrice} from "@/hooks/usePrices";
import BigNumber from "bignumber.js";
import {VerifiedBadge} from "@/components/ui/badge/verified";
import {formatUsdAmount} from "@/utils/formatter";
import {useNavigation} from "@/hooks/useNavigation";

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
        return marketData?.last_price
    }, [marketData])

    const displayVolume = useMemo(() => {
        return marketData?.quote_volume || 0
    }, [marketData])

    const displayUsdVolume = useMemo(() => {
        return formatUsdAmount(quoteUsdValue(new BigNumber(displayVolume)))
    }, [displayVolume, quoteUsdValue])

    const isVerifiedMarket = useMemo(() => {
        return !!baseAsset?.verified && !!quoteAsset?.verified;
    }, [baseAsset, quoteAsset])

    const isPositive = useMemo(() => {
        if (!marketData) return false;

        return marketData.change > 0;
    }, [marketData])

    return (
        <Box
            p={5}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            cursor="pointer"
            transition="all 0.2s"
            shadow="sm"
            _hover={{
                bg: "bg.muted",
                shadow: "md",
                transform: "translateY(-2px)"
            }}
            onClick={onClick}
            bg="bg.panel"
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
                    <LPTokenLogo
                        baseAssetLogo={baseAsset?.logo || ''}
                        quoteAssetLogo={quoteAsset?.logo || ''}
                        baseAssetSymbol={baseAsset?.ticker || market.base}
                        quoteAssetSymbol={quoteAsset?.ticker || market.quote}
                        size="10"
                    />
                    <VStack align="start" gap={1}>
                        <HStack gap={2}>
                            <Text fontWeight="bold" fontSize="lg" letterSpacing="tight">
                                {baseAsset?.ticker}/{quoteAsset?.ticker}
                            </Text>
                            {isVerifiedMarket && (<VerifiedBadge />)}
                        </HStack>
                        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                            {baseAsset?.name} / {quoteAsset?.name}
                        </Text>
                    </VStack>
                </HStack>

                {/* Price */}
                <VStack align="end" gap={1}>
                    <Text fontWeight="semibold" fontSize="md">
                        {displayPrice} {quoteAsset?.ticker}
                    </Text>
                    <Badge
                        colorPalette={isPositive ? 'green' : 'red'}
                        variant="subtle"
                        fontSize="xs"
                    >
                        {isPositive ? (
                            <LuTrendingUp size={12} />
                        ) : (
                            <LuTrendingDown size={12} />
                        )}
                        {isPositive ? '+' : ''}{marketData?.change.toFixed(2) || 0}%
                    </Badge>
                </VStack>

                {/* Volume */}
                <VStack align="end" gap={1}>
                    <Text fontWeight="semibold" fontSize="md">
                        {prettyAmount(displayVolume)} {quoteAsset?.ticker}
                    </Text>
                    {!quoteIsUSDC && (
                        <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                            ${displayUsdVolume}
                        </Text>
                    )}
                </VStack>

                {/* Trade Button */}
                <NextLink href="/exchange/market">
                    <Box textAlign="right">
                        <Button
                            size="md"
                            colorPalette="blue"
                            minW="100px"
                            fontWeight="semibold"
                        >
                            Trade <LuArrowRight />
                        </Button>
                    </Box>
                </NextLink>
            </SimpleGrid>

            {/* Mobile View */}
            <VStack align="stretch" gap={4} hideFrom="md">
                <HStack justify="space-between" align="center">
                    <HStack gap={3}>
                        <LPTokenLogo
                            baseAssetLogo={baseAsset?.logo || ''}
                            quoteAssetLogo={quoteAsset?.logo || ''}
                            baseAssetSymbol={baseAsset?.ticker || market.base}
                            quoteAssetSymbol={quoteAsset?.ticker || market.quote}
                            size="10"
                        />
                        <VStack align="start" gap={1}>
                            <HStack gap={2}>
                                <Text fontWeight="bold" fontSize="md" letterSpacing="tight">
                                    {baseAsset?.ticker}/{quoteAsset?.ticker}
                                </Text>
                                {isVerifiedMarket && (<VerifiedBadge />)}
                            </HStack>
                        </VStack>
                    </HStack>
                    <Button
                        size="sm"
                        colorPalette="blue"
                        fontWeight="semibold"
                    >
                        Trade
                    </Button>
                </HStack>

                <SimpleGrid columns={2} gap={4}>
                    <Box
                        p={3}
                        bg="bg.muted"
                        borderRadius="lg"
                        borderWidth="1px"
                    >
                        <Text fontSize="xs" color="fg.muted" mb={2} fontWeight="medium">
                            24h Price
                        </Text>
                        <Text fontWeight="semibold" fontSize="md">
                            {displayPrice} {quoteAsset?.ticker}
                        </Text>
                        <Badge
                            colorPalette={isPositive ? 'green' : 'red'}
                            variant="subtle"
                            fontSize="xs"
                            mt={1}
                        >
                            {isPositive ? (
                                <LuTrendingUp size={10} />
                            ) : (
                                <LuTrendingDown size={10} />
                            )}
                            {isPositive ? '+' : ''}{marketData?.change.toFixed(2) || 0}%
                        </Badge>
                    </Box>

                    <Box
                        p={3}
                        bg="bg.muted"
                        borderRadius="lg"
                        borderWidth="1px"
                    >
                        <Text fontSize="xs" color="fg.muted" mb={2} fontWeight="medium">
                            24h Volume
                        </Text>
                        <Text fontWeight="semibold" fontSize="md">
                            {prettyAmount(displayVolume)} {quoteAsset?.ticker}
                        </Text>
                        {!quoteIsUSDC && (
                            <Text fontSize="xs" color="fg.muted" mt={1}>
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
    const {markets, getMarketData, isLoading: isLoadingMarkets} = useMarkets()
    const {isVerifiedAsset, denomTicker} = useAssets()
    const {compareValues} = useAssetsValue()
    const {toMarketPage} = useNavigation()

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
        toMarketPage(market.base, market.quote)
    }, [toMarketPage])

    return (
        <Box minH="100vh" bg="bg.subtle">
            <Container maxW="7xl" py={12}>
                <VStack gap={8} align="stretch">
                    {/* Page Header */}
                    <VStack gap={3} align="center" mb={4}>
                        <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight">
                            Exchange Markets
                        </Text>
                        <Text fontSize="md" color="fg.muted">
                            Discover and trade verified trading pairs
                        </Text>
                    </VStack>

                    {/* Search and Stats */}
                    <Box
                        p={6}
                        bg="bg.panel"
                        borderRadius="xl"
                        borderWidth="1px"
                        shadow="sm"
                    >
                        <HStack gap={4} wrap="wrap">
                            <Box position="relative" flex="1" minW="300px" maxW="500px">
                                <Input
                                    placeholder="Search markets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    pl="12"
                                    size="lg"
                                    borderRadius="lg"
                                />
                                <Box
                                    position="absolute"
                                    left="4"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    color="fg.muted"
                                >
                                    <LuSearch size={20} />
                                </Box>
                            </Box>
                            <Spacer />
                            <Badge
                                variant="subtle"
                                colorPalette="blue"
                                fontSize="md"
                                px={4}
                                py={2}
                                borderRadius="lg"
                            >
                                {filteredMarkets.length} trading pairs
                            </Badge>
                        </HStack>
                    </Box>

                {/* Market List Header - Desktop Only */}
                <SimpleGrid
                    columns={{ base: 1, md: 4 }}
                    gap={4}
                    px={6}
                    py={3}
                    hideBelow="md"
                    bg="bg.muted"
                    borderRadius="lg"
                >
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                        Market
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textAlign="right">
                        24h Price
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textAlign="right">
                        24h Volume
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textAlign="right">
                        Action
                    </Text>
                </SimpleGrid>

                {/* Market List */}
                <Skeleton asChild loading={isLoadingMarkets}>
                    <VStack gap={3} align="stretch">
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

                {filteredMarkets.length === 0 && !isLoadingMarkets && (
                    <Box
                        textAlign="center"
                        py={16}
                        px={6}
                        bg="bg.panel"
                        borderRadius="xl"
                        borderWidth="1px"
                    >
                        <Text color="fg.muted" fontSize="lg" fontWeight="medium">
                            No markets found matching &quot;{searchTerm}&quot;
                        </Text>
                        <Text color="fg.muted" fontSize="sm" mt={2}>
                            Try adjusting your search terms
                        </Text>
                    </Box>
                )}
            </VStack>
        </Container>
        </Box>
    )
}