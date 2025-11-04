"use client"

import React, {useMemo, useState} from 'react'

import {
    Box,
    Container,
    Text,
    Flex,
    Badge,
    Grid,
    IconButton,
    HStack,
    VStack,
    Separator, Input, Skeleton,
} from '@chakra-ui/react'
import {
    LuChevronDown,
    LuChevronUp,
    LuArrowUpRight,
    LuArrowDownRight,
    LuInfo,
    LuDroplets,
    LuArrowLeftRight,
    LuSearch,
} from 'react-icons/lu'
import {ListingTitle} from "@/components/ui/listing/title";
import {Asset} from "@/types/asset";
import {ASSET_TYPE_FACTORY, ASSET_TYPE_IBC, ASSET_TYPE_NATIVE} from "@/constants/assets";
import {isNativeDenom} from "@/utils/denom";
import {TokenLogo} from "@/components/ui/token_logo";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {useAssetMarkets, useMarket} from "@/hooks/useMarkets";
import {useAssetPrice} from "@/hooks/usePrices";
import {formatUsdAmount, shortNumberFormat} from "@/utils/formatter";
import {prettyAmount, uAmountToBigNumberAmount} from "@/utils/amount";
import {VerifiedBadge} from "@/components/ui/badge/verified";

function AssetItemMarkets({ marketId }: { marketId: string }) {
    const { marketSymbol, marketData, isLoading: marketLoading } = useMarket(marketId)
    const {asset: base, isLoading: baseLoading} = useAsset(marketData?.base ?? "")
    const {asset: quote, isLoading: quoteLoading} = useAsset(marketData?.quote ?? "")

    return (
        <Box
            p={3}
            bg="bg.muted"
            borderRadius="md"
        >
            {/*{ pair: 'ATOM/BZE', exchange: 'DEX1', volume24h: '$567K', priceChange24h: 3.45 }*/}
            <Flex justify="space-between" align="center">
                <Box>
                    <HStack>
                        <Skeleton asChild loading={baseLoading}>
                            <TokenLogo
                                src={base?.logo ?? ""}
                                symbol={base?.ticker ?? ""}
                                size="8"
                                circular={true}
                            />
                        </Skeleton>
                        <Skeleton asChild loading={quoteLoading}>
                            <Box
                                ml={-1}
                                alignItems="center"
                                justifyContent="center"
                                position="relative"
                            >
                                <TokenLogo
                                    src={quote?.logo ?? ""}
                                    symbol={quote?.logo ?? ""}
                                    size="8"
                                    circular={true}
                                />
                            </Box>
                        </Skeleton>
                        <Box
                            ml={2}
                            alignItems="center"
                            justifyContent="center"
                            position="relative"
                        >
                            <Text fontWeight="medium">{marketSymbol}</Text>
                        </Box>
                    </HStack>
                </Box>
                <Box textAlign="right">
                    <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                    <Skeleton asChild loading={marketLoading || quoteLoading}>
                        <Text fontSize="sm" fontWeight="medium">{marketData?.quote_volume} {quote?.ticker}</Text>
                    </Skeleton>
                    <Text fontSize="xs" color="fg.muted">24h Change</Text>
                    <Skeleton asChild loading={marketLoading}>
                        <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color={marketData && marketData?.change > 0 ? 'green.500' : 'red.500'}
                        >
                            {marketData && marketData?.change > 0 ? '+' : ''}{marketData?.change}%
                        </Text>
                    </Skeleton>
                </Box>
            </Flex>
        </Box>)
}

function AssetItem({ asset, isExpanded, toggleExpanded }: { asset: Asset, isExpanded: boolean, toggleExpanded: (denom: string) => void }) {
    const {assetMarketsData, getAsset24hTradedVolume} = useAssetMarkets(asset.denom)
    const { price, change, isLoading: priceLoading } = useAssetPrice(asset.denom)

    //todo: add show more button to show more markets if the slice of markets is too long
    const markets = assetMarketsData()
        .sort((a, b) => {
            // Get the relevant volume for market 'a'
            const volumeA = asset.denom === a.base ? (a.base_volume || 0) : (a.quote_volume || 0);
            // Get the relevant volume for market 'b'
            const volumeB = asset.denom === b.base ? (b.base_volume || 0) : (b.quote_volume || 0);

            // Sort descending (the highest volume first)
            return volumeB - volumeA;
        })
        .slice(0, 5)

    const getTypeColor = (type: string) => {
        switch (type) {
            case ASSET_TYPE_NATIVE:
                return 'purple'
            case ASSET_TYPE_FACTORY:
                return 'blue'
            case ASSET_TYPE_IBC:
                return 'teal'
            default:
                return 'gray'
        }
    }

    const formattedPrice = useMemo(() => {
        return formatUsdAmount(price)
    }, [price])

    const formattedSupply = useMemo(() => {
        return shortNumberFormat(uAmountToBigNumberAmount(asset.supply, asset.decimals))
    }, [asset.supply, asset.decimals])

    const renderChangeArrow = () => {
        if (change > 0) {
            return  <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
        }
        if (change < 0) {
            return  <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
        }
        return null
    }

    const renderChangeText = () => {
        if (change > 0) {
            return <Text fontSize="sm" color="green.500">+{change}%</Text>
        }

        if (change < 0) {
            return <Text fontSize="sm" color="red.500">{change}%</Text>
        }

        return <Text fontSize="sm" color="red.200">{change}%</Text>
    }

    return (
        <Box
            key={asset.denom}
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.2s"
        >
            {/* Main Asset Info */}
            <Flex
                p={4}
                align="center"
                justify="space-between"
                cursor="pointer"
                onClick={() => toggleExpanded(asset.denom)}
                _hover={{ bg: "bg.muted" }}
            >
                <HStack gap={3}>
                    <Box
                        position="relative"
                        width="40px"
                        height="40px"
                        borderRadius="full"
                        bg="bg.surface"
                        borderWidth="1px"
                        borderColor="border.subtle"
                    >
                        <TokenLogo
                            src={asset.logo}
                            symbol={asset.ticker}
                            circular={true}
                        />
                    </Box>
                    <Box>
                        <HStack gap={2}>
                            <Text fontWeight="semibold" fontSize="md">
                                {asset.name}
                            </Text>
                            <Badge colorPalette={getTypeColor(asset.type)} size="sm">
                                {asset.type.toUpperCase()}
                            </Badge>
                            {asset.verified && (<VerifiedBadge/>)}
                        </HStack>
                        <Text color="fg.muted" fontSize="sm">
                            {asset.ticker}
                        </Text>
                    </Box>
                </HStack>

                <HStack gap={4}>
                    <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
                        <Skeleton asChild loading={priceLoading}>
                            <Text fontWeight="medium" fontSize="md">
                                ${formattedPrice}
                            </Text>
                        </Skeleton>
                        <Skeleton asChild loading={priceLoading}>
                            <HStack gap={1} justify="flex-end">
                                {renderChangeArrow()}
                                {renderChangeText()}
                            </HStack>
                        </Skeleton>
                    </Box>
                    <IconButton
                        aria-label="Toggle details"
                        size="sm"
                        variant="ghost"
                    >
                        {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </IconButton>
                </HStack>
            </Flex>

            {/* Mobile Price Display */}
            <Box display={{ base: 'block', sm: 'none' }} px={4} pb={2}>
                <HStack justify="space-between">
                    <Text fontWeight="medium">$1.312</Text>
                    <HStack gap={1}>
                        {change > 0 ? (
                            <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                        ) : (
                            <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                        )}
                        <Text
                            fontSize="sm"
                            color={change > 0 ? 'green.500' : 'red.500'}
                        >
                            {change > 0 ? '+' : ''}{change}%
                        </Text>
                    </HStack>
                </HStack>
            </Box>

            {/* Expanded Details */}
            <Box
                display={isExpanded ? 'block' : 'none'}
                borderTopWidth="1px"
                borderColor="border.subtle"
                p={4}
                style={{
                    transition: 'max-height 0.3s ease-in-out',
                }}
            >
                <VStack align="stretch" gap={4}>
                    {/* Market Stats */}
                    <Grid gridTemplateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={3}>
                        <Box>
                            <Text color="fg.muted" fontSize="sm">Supply on BeeZee</Text>
                            <Text fontWeight="medium">{formattedSupply} {asset.ticker}</Text>
                        </Box>
                        <Box>
                            <Text color="fg.muted" fontSize="sm">24h Volume</Text>
                            <Text fontWeight="medium">{prettyAmount(getAsset24hTradedVolume())} {asset.ticker}</Text>
                        </Box>
                        <Box>
                            <Text color="fg.muted" fontSize="sm">Type</Text>
                            <Badge colorPalette={getTypeColor(asset.type)} size="sm">
                                {asset.type.toUpperCase()}
                            </Badge>
                        </Box>
                    </Grid>

                    <Separator />

                    {/* Trading Pairs */}
                    <Box>
                        <HStack mb={3}>
                            <LuArrowLeftRight size={16} />
                            <Text fontWeight="semibold">Trading Pairs</Text>
                        </HStack>
                        {markets.length > 0 ? (
                            <VStack align="stretch" gap={2}>
                                {markets.map((market) => (
                                    <AssetItemMarkets key={market.market_id} marketId={market.market_id} />
                                ))}
                            </VStack>
                        ) : (
                            <Text color="fg.muted" fontSize="sm">No trading pairs available</Text>
                        )}
                    </Box>

                    {/* Liquidity Pools */}
                    <Box>
                        <HStack mb={3}>
                            <LuDroplets size={16} />
                            <Text fontWeight="semibold">Liquidity Pools</Text>
                        </HStack>
                        {/*TODO: add liquidity pools*/}
                        {/*{asset.liquidityPools.length > 0 ? (*/}
                        {/*    <VStack align="stretch" gap={2}>*/}
                        {/*        {asset.liquidityPools.map((pool, index) => (*/}
                        {/*            <Box*/}
                        {/*                key={index}*/}
                        {/*                p={3}*/}
                        {/*                bg="bg.muted"*/}
                        {/*                borderRadius="md"*/}
                        {/*            >*/}
                        {/*                <Text fontWeight="medium" mb={2}>{pool.name}</Text>*/}
                        {/*                <Grid gridTemplateColumns="repeat(3, 1fr)" gap={2}>*/}
                        {/*                    <Box>*/}
                        {/*                        <Text color="fg.muted" fontSize="xs">TVL</Text>*/}
                        {/*                        <Text fontSize="sm" fontWeight="medium">{pool.tvl}</Text>*/}
                        {/*                    </Box>*/}
                        {/*                    <Box>*/}
                        {/*                        <Text color="fg.muted" fontSize="xs">APR</Text>*/}
                        {/*                        <Text fontSize="sm" fontWeight="medium" color="green.500">{pool.apr}</Text>*/}
                        {/*                    </Box>*/}
                        {/*                    <Box>*/}
                        {/*                        <Text color="fg.muted" fontSize="xs">24h Volume</Text>*/}
                        {/*                        <Text fontSize="sm" fontWeight="medium">{pool.volume24h}</Text>*/}
                        {/*                    </Box>*/}
                        {/*                </Grid>*/}
                        {/*            </Box>*/}
                        {/*        ))}*/}
                        {/*    </VStack>*/}
                        {/*) : (*/}
                        <Text color="fg.muted" fontSize="sm">No liquidity pools available</Text>
                        {/*)}*/}
                    </Box>

                    {/* Factory Details */}
                    {asset.type === 'factory' && (
                        <>
                            <Separator />
                            <Box>
                                <HStack mb={3}>
                                    <LuInfo size={16} />
                                    <Text fontWeight="semibold">Factory Details</Text>
                                </HStack>
                                <Grid gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Creator</Text>
                                        <Text fontSize="sm" fontFamily="mono">bzesdsa...2311213</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Created At</Text>
                                        <Text fontSize="sm">Joi la 13:30</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Current Supply</Text>
                                        <Text fontSize="sm">1,333,212.231</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Max Supply</Text>
                                        <Text fontSize="sm">200,000,000</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Features</Text>
                                        <HStack gap={2}>
                                            {1 && (
                                                <Badge colorPalette="green" size="sm">Mintable</Badge>
                                            )}
                                            {1 && (
                                                <Badge colorPalette="orange" size="sm">Burnable</Badge>
                                            )}
                                        </HStack>
                                    </Box>
                                </Grid>
                            </Box>
                        </>
                    )}

                    {/* IBC Details */}
                    {asset.type === 'ibc' && (
                        <>
                            <Separator />
                            <Box>
                                <HStack mb={3}>
                                    <LuInfo size={16} />
                                    <Text fontWeight="semibold">IBC Details</Text>
                                </HStack>
                                <Grid gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={3}>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Source Chain</Text>
                                        <Text fontSize="sm">AtomOne</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Channel ID</Text>
                                        <Text fontSize="sm" fontFamily="mono">channel-2</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Base Denom</Text>
                                        <Text fontSize="sm" fontFamily="mono">atone</Text>
                                    </Box>
                                    <Box>
                                        <Text color="fg.muted" fontSize="sm">Path</Text>
                                        <Text fontSize="sm" fontFamily="mono">transfer/channel-2/test</Text>
                                    </Box>
                                </Grid>
                            </Box>
                        </>
                    )}
                </VStack>
            </Box>
        </Box>
    )
}

export default function AssetsPage() {
    const [expandedAsset, setExpandedAsset] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const {isLoading, assets} = useAssets()

    const filteredAssets = () => {
        if (searchTerm === '') {
            return assets.sort((token1: Asset, token2: Asset) => {
                if (isNativeDenom(token1.denom)) {
                    return -1;
                }

                if (token1.verified && !token2.verified) {
                    return -1;
                }

                if (token2.verified && !token1.verified) {
                    return 1;
                }

                return token1.name > token2.name ? 1 : -1;
            })
        } else {
            return assets.filter(asset =>
                asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.ticker.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
    }

    const toggleExpanded = (assetId: string) => {
        setExpandedAsset(assetId !== expandedAsset ? assetId : '')
    }

    return (
        <Container maxW="7xl" py={8}>
            <VStack align="stretch" gap={6}>
                {/* Header */}
                <ListingTitle title={"Assets"} subtitle={"Explore all available tokens on the BeeZee blockchain"} />
                {/* Stats Bar */}
                <Grid gridTemplateColumns={{ base: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Total Assets</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">{assets.length}</Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Native</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assets.filter(a => a.type === ASSET_TYPE_NATIVE).length}
                            </Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Factory</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assets.filter(a => a.type === ASSET_TYPE_FACTORY).length}
                            </Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">IBC</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assets.filter(a => a.type === ASSET_TYPE_IBC).length}
                            </Text>
                        </Skeleton>
                    </Box>
                </Grid>

                <Box position="relative" w="full">
                    <Input
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="lg"
                        pl={10}
                    />
                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                        <LuSearch color="gray" />
                    </Box>
                </Box>
                {/* Assets List */}
                <VStack align="stretch" gap={3}>
                    {filteredAssets().map(asset =>
                        <AssetItem asset={asset} isExpanded={expandedAsset === asset.denom} key={asset.denom} toggleExpanded={toggleExpanded} />
                    )}
                </VStack>
            </VStack>
        </Container>
    )
}