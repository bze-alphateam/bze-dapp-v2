"use client"

import React, {useCallback, useEffect, useMemo, useState} from 'react'

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
import {useNavigation} from "@/hooks/useNavigation";
import {createMarketId} from "@/utils/market";
import {LPTokenLogo} from "@/components/ui/lp_token_logo";
import {useLiquidityPools} from "@/hooks/useLiquidityPools";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";

const MAX_MARKETS_PER_ASSET = 5;

function AssetItemLiquidityPool({ pool }: { pool: LiquidityPoolSDKType }) {
    const {asset: base, isLoading: baseLoading} = useAsset(pool.base)
    const {asset: quote, isLoading: quoteLoading} = useAsset(pool.quote)
    const {toLpPage} = useNavigation()
    const {poolsData} = useLiquidityPools()

    const poolData = poolsData.get(pool.id)
    const hasUsdValue = poolData?.isComplete && poolData?.usdValue && poolData.usdValue.gt(0)

    return (
        <Box
            p={4}
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            cursor="pointer"
            onClick={() => toLpPage(pool.id)}
            transition="all 0.2s"
            _hover={{
                bg: "bg.muted",
                borderColor: "border.emphasized",
                transform: "translateY(-2px)",
                shadow: "md"
            }}
        >
            <Flex
                justify="space-between"
                align="center"
                gap={3}
                flexDirection={{ base: 'column', sm: 'row' }}
            >
                <HStack gap={3} flex="1">
                    <Skeleton asChild loading={baseLoading || quoteLoading}>
                        <Box flexShrink={0}>
                            <LPTokenLogo
                                baseAssetLogo={base?.logo ?? ""}
                                quoteAssetLogo={quote?.logo ?? ""}
                                baseAssetSymbol={base?.ticker ?? ""}
                                quoteAssetSymbol={quote?.ticker ?? ""}
                            />
                        </Box>
                    </Skeleton>
                    <Box minW={0}>
                        <Text fontWeight="semibold" fontSize="md">
                            {base?.ticker}/{quote?.ticker}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">Liquidity Pool</Text>
                    </Box>
                </HStack>

                <Box
                    textAlign={{ base: 'left', sm: 'right' }}
                    w={{ base: 'full', sm: 'auto' }}
                    flexShrink={0}
                >
                    <Text fontSize="xs" color="fg.muted" mb={1}>TVL</Text>
                    {hasUsdValue ? (
                        <Text fontSize="lg" fontWeight="semibold">
                            ${shortNumberFormat(poolData.usdValue)}
                        </Text>
                    ) : (
                        <VStack align={{ base: 'flex-start', sm: 'flex-end' }} gap={0.5}>
                            <Skeleton asChild loading={baseLoading}>
                                <Text fontSize="sm" fontWeight="medium">
                                    {shortNumberFormat(uAmountToBigNumberAmount(pool.reserve_base, base?.decimals || 0))} {base?.ticker}
                                </Text>
                            </Skeleton>
                            <Skeleton asChild loading={quoteLoading}>
                                <Text fontSize="sm" fontWeight="medium">
                                    {shortNumberFormat(uAmountToBigNumberAmount(pool.reserve_quote, quote?.decimals || 0))} {quote?.ticker}
                                </Text>
                            </Skeleton>
                        </VStack>
                    )}
                </Box>
            </Flex>
        </Box>
    )
}

function AssetItemMarkets({ marketId }: { marketId: string }) {
    const { marketSymbol, market, marketData, isLoading: marketLoading } = useMarket(marketId)
    const {asset: base, isLoading: baseLoading} = useAsset(market?.base ?? "")
    const {asset: quote, isLoading: quoteLoading} = useAsset(market?.quote ?? "")
    const {toMarketPage} = useNavigation()

    return (
        <Box
            p={4}
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            cursor="pointer"
            onClick={() => toMarketPage(base?.denom ?? "", quote?.denom ?? "")}
            transition="all 0.2s"
            _hover={{
                bg: "bg.muted",
                borderColor: "border.emphasized",
                transform: "translateY(-2px)",
                shadow: "md"
            }}
        >
            <Flex
                justify="space-between"
                align="center"
                gap={3}
                flexDirection={{ base: 'column', sm: 'row' }}
            >
                <HStack gap={3} flex="1">
                    <Skeleton asChild loading={baseLoading}>
                        <Box flexShrink={0}>
                            <LPTokenLogo
                                baseAssetLogo={base?.logo ?? ""}
                                quoteAssetLogo={quote?.logo ?? ""}
                                baseAssetSymbol={base?.ticker ?? ""}
                                quoteAssetSymbol={quote?.ticker ?? ""}
                            />
                        </Box>
                    </Skeleton>
                    <Box minW={0}>
                        <Text fontWeight="semibold" fontSize="md">
                            {marketSymbol}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">Market</Text>
                    </Box>
                </HStack>

                {marketData && (
                    <Flex
                        gap={4}
                        align="center"
                        flexShrink={0}
                        w={{ base: 'full', sm: 'auto' }}
                        justify={{ base: 'space-between', sm: 'flex-end' }}
                    >
                        <Box textAlign={{ base: 'left', sm: 'right' }}>
                            <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                            <Skeleton asChild loading={marketLoading || quoteLoading}>
                                <Text fontSize="sm" fontWeight="medium">
                                    {marketData?.quote_volume} {quote?.ticker}
                                </Text>
                            </Skeleton>
                        </Box>
                        <Box textAlign="right">
                            <Text fontSize="xs" color="fg.muted">24h Change</Text>
                            <Skeleton asChild loading={marketLoading}>
                                <HStack gap={1} justify={{ base: 'flex-start', sm: 'flex-end' }}>
                                    {marketData && marketData?.change !== 0 && (
                                        marketData.change > 0 ? (
                                            <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                                        ) : (
                                            <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                                        )
                                    )}
                                    <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        color={marketData && marketData?.change > 0 ? 'green.500' : marketData?.change < 0 ? 'red.500' : 'fg.muted'}
                                    >
                                        {marketData && marketData?.change > 0 ? '+' : ''}{marketData?.change}%
                                    </Text>
                                </HStack>
                            </Skeleton>
                        </Box>
                    </Flex>
                )}
                {!marketData && (
                    <Box textAlign="right" flexShrink={0}>
                        <Text fontSize="sm" color="fg.muted">No data available</Text>
                    </Box>
                )}
            </Flex>
        </Box>)
}

function AssetItem({ asset, isExpanded, toggleExpanded, pools }: { asset: Asset, isExpanded: boolean, toggleExpanded: (denom: string) => void, pools: LiquidityPoolSDKType[] }) {
    const [priceLoadedOnce, setPriceLoadedOnce] = useState(false)

    const {assetMarketsData, getAsset24hTradedVolume, assetMarkets} = useAssetMarkets(asset.denom)
    const { price, change, isLoading: priceLoading } = useAssetPrice(asset.denom)

    const markets = useMemo(() => {
        const marketsWithData = assetMarketsData
            .sort((a, b) => {
                // Get the relevant volume for market 'a'
                const volumeA = asset.denom === a.base ? (a.base_volume || 0) : (a.quote_volume || 0);
                // Get the relevant volume for market 'b'
                const volumeB = asset.denom === b.base ? (b.base_volume || 0) : (b.quote_volume || 0);

                // Sort descending (the highest volume first)
                return volumeB - volumeA;
            })
            .slice(0, MAX_MARKETS_PER_ASSET)
            .map(market => ({market_id: market.market_id}))

        const missingMarkets = MAX_MARKETS_PER_ASSET - marketsWithData.length
        if (missingMarkets > 0) {
            //fill the rest with markets without data
            let added = 0
            for (const market of assetMarkets) {
                const mId = createMarketId(market.base, market.quote)
                const reverseMId = createMarketId(market.quote, market.base)
                const found = marketsWithData.find(item => item.market_id === mId || item.market_id === reverseMId)
                if (found) continue

                marketsWithData.push({market_id: mId})
                added++
                if (added >= missingMarkets) break
            }
        }

        return marketsWithData
    }, [assetMarketsData, assetMarkets, asset])

    const assetPools = useMemo(() => {
        if (!pools) return [];

        return pools.filter(item => item.base === asset.denom || item.quote === asset.denom).slice(0, MAX_MARKETS_PER_ASSET)
    }, [pools, asset])

    const getTypeColor = useCallback((type: string) => {
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
    }, [])

    const formattedPrice = useMemo(() => {
        return formatUsdAmount(price)
    }, [price])

    const formattedSupply = useMemo(() => {
        return shortNumberFormat(uAmountToBigNumberAmount(asset.supply, asset.decimals))
    }, [asset.supply, asset.decimals])

    const renderChangeArrow = useMemo(() => {
        if (change > 0) {
            return  <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
        }
        if (change < 0) {
            return  <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
        }
        return null
    }, [change])

    const renderChangeText = useMemo(() => {
        if (change > 0) {
            return <Text fontSize="sm" color="green.500">+{change}%</Text>
        }

        if (change < 0) {
            return <Text fontSize="sm" color="red.500">{change}%</Text>
        }

        return <Text fontSize="sm" color="red.200">{change}%</Text>
    }, [change])

    useEffect(() => {
        //change the state of it only if it wasn't loaded yet
        if (priceLoadedOnce) return;

        setPriceLoadedOnce(!priceLoading)
        //eslint-disable-next-line
    }, [priceLoading]);

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
                        <Skeleton asChild loading={!priceLoadedOnce}>
                            <Text fontWeight="medium" fontSize="md">
                                ${formattedPrice}
                            </Text>
                        </Skeleton>
                        <Skeleton asChild loading={!priceLoadedOnce}>
                            <HStack gap={1} justify="flex-end">
                                {renderChangeArrow}
                                {renderChangeText}
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
                    <Text fontWeight="medium">${formattedPrice}</Text>
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
                            <Text fontWeight="medium">{prettyAmount(getAsset24hTradedVolume)} {asset.ticker}</Text>
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
                        {assetPools.length > 0 ? (
                            <VStack align="stretch" gap={2}>
                                {assetPools.map((pool) => (
                                    <AssetItemLiquidityPool key={pool.id} pool={pool} />
                                ))}
                            </VStack>
                        ) : (
                        <Text color="fg.muted" fontSize="sm">No liquidity pools available</Text>
                        )}
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
    const {isLoading, assetsLpExcluded} = useAssets()
    const {pools} = useLiquidityPools()

    const filteredAssets = () => {
        if (searchTerm === '') {
            return assetsLpExcluded.sort((token1: Asset, token2: Asset) => {
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
            return assetsLpExcluded.filter(asset =>
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
                            <Text fontSize="2xl" fontWeight="bold">{assetsLpExcluded.length}</Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Native</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assetsLpExcluded.filter(a => a.type === ASSET_TYPE_NATIVE).length}
                            </Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Factory</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assetsLpExcluded.filter(a => a.type === ASSET_TYPE_FACTORY).length}
                            </Text>
                        </Skeleton>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">IBC</Text>
                        <Skeleton asChild loading={isLoading}>
                            <Text fontSize="2xl" fontWeight="bold">
                                {assetsLpExcluded.filter(a => a.type === ASSET_TYPE_IBC).length}
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
                        <AssetItem asset={asset} isExpanded={expandedAsset === asset.denom} key={asset.denom} toggleExpanded={toggleExpanded} pools={pools}/>
                    )}
                </VStack>
            </VStack>
        </Container>
    )
}