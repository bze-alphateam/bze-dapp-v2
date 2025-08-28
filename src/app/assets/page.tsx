"use client"

import React, {useState} from 'react'

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
    LuSearch, LuShield
} from 'react-icons/lu'
import {ListingTitle} from "@/components/ui/listing/title";
import {Asset} from "@/types/asset";
import {ASSET_TYPE_FACTORY, ASSET_TYPE_IBC, ASSET_TYPE_NATIVE} from "@/constants/assets";
import {isNativeDenom} from "@/utils/denom";
import {TokenLogo} from "@/components/ui/token_logo";
import {useAssets} from "@/hooks/useAssets";
import {useMarkets, useMarketTradingData} from "@/hooks/useMarkets";

// const mockAssets = [
//     {
//         name: 'BeeZee',
//         ticker: 'BZE',
//         type: 'native',
//         logo: '/images/bze_alternative_512x512.png',
//         price: '$0.0234',
//         priceChange24h: 5.67,
//         marketCap: '$2.34M',
//         volume24h: '$456.7K',
//         tradingPairs: [
//             { pair: 'BZE/USDT', exchange: 'DEX1', volume24h: '$234.5K', priceChange24h: 5.2 },
//             { pair: 'BZE/ATOM', exchange: 'DEX2', volume24h: '$122.2K', priceChange24h: 6.1 }
//         ],
//         liquidityPools: [
//             { name: 'BZE/USDT Pool', tvl: '$1.2M', apr: '45.6%', volume24h: '$234.5K' },
//             { name: 'BZE/ATOM Pool', tvl: '$890K', apr: '38.2%', volume24h: '$122.2K' }
//         ]
//     },
//     {
//         name: 'Wrapped Bitcoin',
//         ticker: 'WBTC',
//         type: 'ibc',
//         logo: '/images/token.svg',
//         price: '$42,156.23',
//         priceChange24h: -2.34,
//         marketCap: '$45.6M',
//         volume24h: '$1.2M',
//         tradingPairs: [
//             { pair: 'WBTC/BZE', exchange: 'DEX1', volume24h: '$567.8K', priceChange24h: -2.1 },
//             { pair: 'WBTC/USDT', exchange: 'DEX1', volume24h: '$632.2K', priceChange24h: -2.5 }
//         ],
//         liquidityPools: [
//             { name: 'WBTC/BZE Pool', tvl: '$3.4M', apr: '22.3%', volume24h: '$567.8K' }
//         ],
//         ibcDetails: {
//             sourceChain: 'Cosmos Hub',
//             channelId: 'channel-141',
//             baseDenom: 'uatom',
//             path: 'transfer/channel-141',
//             lastUpdate: '2024-01-15 14:30:00'
//         }
//     },
//     {
//         name: 'Stable USD',
//         ticker: 'SUSD',
//         type: 'factory',
//         logo: '/images/logo_320px.png',
//         price: '$1.00',
//         priceChange24h: 0.01,
//         marketCap: '$12.3M',
//         volume24h: '$2.3M',
//         tradingPairs: [
//             { pair: 'SUSD/BZE', exchange: 'DEX1', volume24h: '$1.1M', priceChange24h: 0.02 },
//             { pair: 'SUSD/USDT', exchange: 'DEX2', volume24h: '$1.2M', priceChange24h: 0.01 }
//         ],
//         liquidityPools: [
//             { name: 'SUSD/BZE Pool', tvl: '$5.6M', apr: '12.4%', volume24h: '$1.1M' },
//             { name: 'SUSD/USDT Pool', tvl: '$7.8M', apr: '8.9%', volume24h: '$1.2M' },
//             { name: 'SUSD/DAI Pool', tvl: '$4.2M', apr: '6.7%', volume24h: '$890K' }
//         ],
//         factoryDetails: {
//             creator: 'bze1qxy...7n8p',
//             mintable: true,
//             burnable: true,
//             maxSupply: '100,000,000',
//             currentSupply: '12,345,678',
//             createdAt: '2023-12-01 10:00:00'
//         }
//     },
//     {
//         name: 'Cosmos',
//         ticker: 'ATOM',
//         type: 'ibc',
//         logo: '/images/token.svg',
//         price: '$9.87',
//         priceChange24h: 3.45,
//         marketCap: '$2.8M',
//         volume24h: '$567K',
//         tradingPairs: [
//             { pair: 'ATOM/BZE', exchange: 'DEX1', volume24h: '$567K', priceChange24h: 3.45 }
//         ],
//         liquidityPools: [
//             { name: 'ATOM/BZE Pool', tvl: '$1.8M', apr: '28.9%', volume24h: '$567K' }
//         ],
//         ibcDetails: {
//             sourceChain: 'Cosmos Hub',
//             channelId: 'channel-0',
//             baseDenom: 'uatom',
//             path: 'transfer/channel-0',
//             lastUpdate: '2024-01-15 12:00:00'
//         }
//     },
//     {
//         name: 'Meme Token',
//         ticker: 'MEME',
//         type: 'factory',
//         logo: '/images/logo_320px.png',
//         price: '$0.00001234',
//         priceChange24h: 156.78,
//         marketCap: '$456K',
//         volume24h: '$234K',
//         tradingPairs: [],
//         liquidityPools: [],
//         factoryDetails: {
//             creator: 'bze1abc...xyz9',
//             mintable: false,
//             burnable: true,
//             maxSupply: '1,000,000,000,000',
//             currentSupply: '1,000,000,000,000',
//             createdAt: '2024-01-10 15:30:00'
//         }
//     },
//     {
//         name: 'Osmosis',
//         ticker: 'OSMO',
//         type: 'ibc',
//         logo: '/images/token.svg',
//         price: '$0.756',
//         priceChange24h: -1.23,
//         marketCap: '$1.2M',
//         volume24h: '$123K',
//         tradingPairs: [],
//         liquidityPools: [],
//         ibcDetails: {
//             sourceChain: 'Osmosis',
//             channelId: 'channel-95',
//             baseDenom: 'uosmo',
//             path: 'transfer/channel-95',
//             lastUpdate: '2024-01-14 09:15:00'
//         }
//     }
// ] as const

export default function AssetsPage() {
    const [expandedAsset, setExpandedAsset] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')

    const {isLoading, assets, getAssetByDenom} = useAssets()
    const { getMarketSymbol } = useMarkets()
    const { getAssetMarketsData } = useMarketTradingData()

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

    const renderAssetCard = (asset: Asset) => {
        const isExpanded = asset.denom === expandedAsset
        //todo: sort markets by volume24h
        const markets = getAssetMarketsData(asset.denom).slice(0, 5)

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
                                {asset.verified &&
                                    <Badge colorPalette={'green'} variant="subtle">
                                        <HStack gap="1">
                                            <LuShield size={12} />
                                            <Text>Verified</Text>
                                        </HStack>
                                    </Badge>
                                }
                            </HStack>
                            <Text color="fg.muted" fontSize="sm">
                                {asset.ticker}
                            </Text>
                        </Box>
                    </HStack>

                    <HStack gap={4}>
                        <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
                            <Text fontWeight="medium" fontSize="md">
                                $1.312
                            </Text>
                            <HStack gap={1} justify="flex-end">
                                {1 > 0 ? (
                                    <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                                ) : (
                                    <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                                )}
                                <Text
                                    fontSize="sm"
                                    color={1 > 0 ? 'green.500' : 'red.500'}
                                >
                                    23%
                                </Text>
                            </HStack>
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
                            {1 > 0 ? (
                                <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                            ) : (
                                <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                            )}
                            <Text
                                fontSize="sm"
                                color={1 > 0 ? 'green.500' : 'red.500'}
                            >
                                23%
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
                                <Text color="fg.muted" fontSize="sm">Market Cap</Text>
                                <Text fontWeight="medium">$32,021.321</Text>
                            </Box>
                            <Box>
                                <Text color="fg.muted" fontSize="sm">24h Volume</Text>
                                <Text fontWeight="medium">$130.2</Text>
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
                                    {markets.map((market) => {
                                        const base = getAssetByDenom(market.base)
                                        const quote = getAssetByDenom(market.quote)

                                        return (
                                            <Box
                                                key={market.market_id}
                                                p={3}
                                                bg="bg.muted"
                                                borderRadius="md"
                                            >
                                            {/*{ pair: 'ATOM/BZE', exchange: 'DEX1', volume24h: '$567K', priceChange24h: 3.45 }*/}
                                            <Flex justify="space-between" align="center">
                                                <Box>
                                                    <HStack>
                                                        <TokenLogo
                                                            src={base?.logo ?? ""}
                                                            symbol={base?.ticker ?? ""}
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
                                                                src={quote?.logo ?? ""}
                                                                symbol={quote?.logo ?? ""}
                                                                size="8"
                                                                circular={true}
                                                            />
                                                        </Box>
                                                        <Box
                                                            ml={2}
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            position="relative"
                                                        >
                                                            <Text fontWeight="medium">{getMarketSymbol(market)}</Text>
                                                        </Box>
                                                    </HStack>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Text fontSize="xs" color="fg.muted">24h Volume</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{market.quote_volume} {quote?.ticker}</Text>
                                                    <Text fontSize="xs" color="fg.muted">24h Change</Text>
                                                    <Text
                                                        fontSize="sm"
                                                        fontWeight="medium"
                                                        color={market.change > 0 ? 'green.500' : 'red.500'}
                                                    >
                                                        {market.change > 0 ? '+' : ''}{market.change}%
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        </Box>)
                                    })}
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
                    {filteredAssets().map(renderAssetCard)}
                </VStack>
            </VStack>
        </Container>
    )
}