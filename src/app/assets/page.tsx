"use client"

import React, { useState } from 'react'
import Image from 'next/image'
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
    Separator, Input,
} from '@chakra-ui/react'
import {
    LuChevronDown,
    LuChevronUp,
    LuArrowUpRight,
    LuArrowDownRight,
    LuInfo,
    LuDroplets,
    LuArrowLeftRight,
    LuSearch
} from 'react-icons/lu'
import {ListingTitle} from "@/components/ui/listing/title";

// Type definitions
type TokenType = 'native' | 'factory' | 'ibc'

type TradingPair = {
    pair: string
    exchange: string
    volume24h: string
    priceChange24h: number
}

type LiquidityPool = {
    name: string
    tvl: string
    apr: string
    volume24h: string
}

type FactoryDetails = {
    creator: string
    mintable: boolean
    burnable: boolean
    maxSupply: string
    currentSupply: string
    createdAt: string
}

type IBCDetails = {
    sourceChain: string
    channelId: string
    baseDenom: string
    path: string
    lastUpdate: string
}

type Asset = {
    id: string
    name: string
    ticker: string
    type: TokenType
    logo: string
    price: string
    priceChange24h: number
    marketCap: string
    volume24h: string
    tradingPairs: TradingPair[]
    liquidityPools: LiquidityPool[]
    factoryDetails?: FactoryDetails
    ibcDetails?: IBCDetails
}

// Mock data
const mockAssets: Asset[] = [
    {
        id: '1',
        name: 'BeeZee',
        ticker: 'BZE',
        type: 'native',
        logo: '/images/bze_alternative_512x512.png',
        price: '$0.0234',
        priceChange24h: 5.67,
        marketCap: '$2.34M',
        volume24h: '$456.7K',
        tradingPairs: [
            { pair: 'BZE/USDT', exchange: 'DEX1', volume24h: '$234.5K', priceChange24h: 5.2 },
            { pair: 'BZE/ATOM', exchange: 'DEX2', volume24h: '$122.2K', priceChange24h: 6.1 }
        ],
        liquidityPools: [
            { name: 'BZE/USDT Pool', tvl: '$1.2M', apr: '45.6%', volume24h: '$234.5K' },
            { name: 'BZE/ATOM Pool', tvl: '$890K', apr: '38.2%', volume24h: '$122.2K' }
        ]
    },
    {
        id: '2',
        name: 'Wrapped Bitcoin',
        ticker: 'WBTC',
        type: 'ibc',
        logo: '/images/token.svg',
        price: '$42,156.23',
        priceChange24h: -2.34,
        marketCap: '$45.6M',
        volume24h: '$1.2M',
        tradingPairs: [
            { pair: 'WBTC/BZE', exchange: 'DEX1', volume24h: '$567.8K', priceChange24h: -2.1 },
            { pair: 'WBTC/USDT', exchange: 'DEX1', volume24h: '$632.2K', priceChange24h: -2.5 }
        ],
        liquidityPools: [
            { name: 'WBTC/BZE Pool', tvl: '$3.4M', apr: '22.3%', volume24h: '$567.8K' }
        ],
        ibcDetails: {
            sourceChain: 'Cosmos Hub',
            channelId: 'channel-141',
            baseDenom: 'uatom',
            path: 'transfer/channel-141',
            lastUpdate: '2024-01-15 14:30:00'
        }
    },
    {
        id: '3',
        name: 'Stable USD',
        ticker: 'SUSD',
        type: 'factory',
        logo: '/images/logo_320px.png',
        price: '$1.00',
        priceChange24h: 0.01,
        marketCap: '$12.3M',
        volume24h: '$2.3M',
        tradingPairs: [
            { pair: 'SUSD/BZE', exchange: 'DEX1', volume24h: '$1.1M', priceChange24h: 0.02 },
            { pair: 'SUSD/USDT', exchange: 'DEX2', volume24h: '$1.2M', priceChange24h: 0.01 }
        ],
        liquidityPools: [
            { name: 'SUSD/BZE Pool', tvl: '$5.6M', apr: '12.4%', volume24h: '$1.1M' },
            { name: 'SUSD/USDT Pool', tvl: '$7.8M', apr: '8.9%', volume24h: '$1.2M' },
            { name: 'SUSD/DAI Pool', tvl: '$4.2M', apr: '6.7%', volume24h: '$890K' }
        ],
        factoryDetails: {
            creator: 'bze1qxy...7n8p',
            mintable: true,
            burnable: true,
            maxSupply: '100,000,000',
            currentSupply: '12,345,678',
            createdAt: '2023-12-01 10:00:00'
        }
    },
    {
        id: '4',
        name: 'Cosmos',
        ticker: 'ATOM',
        type: 'ibc',
        logo: '/images/token.svg',
        price: '$9.87',
        priceChange24h: 3.45,
        marketCap: '$2.8M',
        volume24h: '$567K',
        tradingPairs: [
            { pair: 'ATOM/BZE', exchange: 'DEX1', volume24h: '$567K', priceChange24h: 3.45 }
        ],
        liquidityPools: [
            { name: 'ATOM/BZE Pool', tvl: '$1.8M', apr: '28.9%', volume24h: '$567K' }
        ],
        ibcDetails: {
            sourceChain: 'Cosmos Hub',
            channelId: 'channel-0',
            baseDenom: 'uatom',
            path: 'transfer/channel-0',
            lastUpdate: '2024-01-15 12:00:00'
        }
    },
    {
        id: '5',
        name: 'Meme Token',
        ticker: 'MEME',
        type: 'factory',
        logo: '/images/logo_320px.png',
        price: '$0.00001234',
        priceChange24h: 156.78,
        marketCap: '$456K',
        volume24h: '$234K',
        tradingPairs: [],
        liquidityPools: [],
        factoryDetails: {
            creator: 'bze1abc...xyz9',
            mintable: false,
            burnable: true,
            maxSupply: '1,000,000,000,000',
            currentSupply: '1,000,000,000,000',
            createdAt: '2024-01-10 15:30:00'
        }
    },
    {
        id: '6',
        name: 'Osmosis',
        ticker: 'OSMO',
        type: 'ibc',
        logo: '/images/token.svg',
        price: '$0.756',
        priceChange24h: -1.23,
        marketCap: '$1.2M',
        volume24h: '$123K',
        tradingPairs: [],
        liquidityPools: [],
        ibcDetails: {
            sourceChain: 'Osmosis',
            channelId: 'channel-95',
            baseDenom: 'uosmo',
            path: 'transfer/channel-95',
            lastUpdate: '2024-01-14 09:15:00'
        }
    }
] as const

type ExpandedAsset = typeof mockAssets[number]

export default function AssetsPage() {
    const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')

    const toggleExpanded = (assetId: string) => {
        setExpandedAssets(prev => {
            const newSet = new Set(prev)
            if (newSet.has(assetId)) {
                newSet.delete(assetId)
            } else {
                newSet.add(assetId)
            }
            return newSet
        })
    }

    const getTypeColor = (type: TokenType) => {
        switch (type) {
            case 'native':
                return 'purple'
            case 'factory':
                return 'blue'
            case 'ibc':
                return 'teal'
            default:
                return 'gray'
        }
    }

    const renderAssetCard = (asset: ExpandedAsset) => {
        const isExpanded = expandedAssets.has(asset.id)

        return (
            <Box
                key={asset.id}
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
                    onClick={() => toggleExpanded(asset.id)}
                    _hover={{ bg: "bg.muted" }}
                >
                    <HStack gap={3}>
                        <Box
                            position="relative"
                            width="40px"
                            height="40px"
                            borderRadius="full"
                            overflow="hidden"
                            bg="bg.surface"
                            borderWidth="1px"
                            borderColor="border.subtle"
                        >
                            <Image
                                src={asset.logo}
                                alt={asset.name}
                                fill
                                style={{ objectFit: 'cover' }}
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
                            </HStack>
                            <Text color="fg.muted" fontSize="sm">
                                {asset.ticker}
                            </Text>
                        </Box>
                    </HStack>

                    <HStack gap={4}>
                        <Box textAlign="right" display={{ base: 'none', sm: 'block' }}>
                            <Text fontWeight="medium" fontSize="md">
                                {asset.price}
                            </Text>
                            <HStack gap={1} justify="flex-end">
                                {asset.priceChange24h > 0 ? (
                                    <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                                ) : (
                                    <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                                )}
                                <Text
                                    fontSize="sm"
                                    color={asset.priceChange24h > 0 ? 'green.500' : 'red.500'}
                                >
                                    {Math.abs(asset.priceChange24h).toFixed(2)}%
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
                        <Text fontWeight="medium">{asset.price}</Text>
                        <HStack gap={1}>
                            {asset.priceChange24h > 0 ? (
                                <LuArrowUpRight size={14} color="var(--chakra-colors-green-500)" />
                            ) : (
                                <LuArrowDownRight size={14} color="var(--chakra-colors-red-500)" />
                            )}
                            <Text
                                fontSize="sm"
                                color={asset.priceChange24h > 0 ? 'green.500' : 'red.500'}
                            >
                                {Math.abs(asset.priceChange24h).toFixed(2)}%
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
                                <Text fontWeight="medium">{asset.marketCap}</Text>
                            </Box>
                            <Box>
                                <Text color="fg.muted" fontSize="sm">24h Volume</Text>
                                <Text fontWeight="medium">{asset.volume24h}</Text>
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
                            {asset.tradingPairs.length > 0 ? (
                                <VStack align="stretch" gap={2}>
                                    {asset.tradingPairs.map((pair, index) => (
                                        <Box
                                            key={index}
                                            p={3}
                                            bg="bg.muted"
                                            borderRadius="md"
                                        >
                                            <Flex justify="space-between" align="center">
                                                <Box>
                                                    <Text fontWeight="medium">{pair.pair}</Text>
                                                    <Text color="fg.muted" fontSize="sm">{pair.exchange}</Text>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Text fontSize="sm">{pair.volume24h}</Text>
                                                    <Text
                                                        fontSize="sm"
                                                        color={pair.priceChange24h > 0 ? 'green.500' : 'red.500'}
                                                    >
                                                        {pair.priceChange24h > 0 ? '+' : ''}{pair.priceChange24h}%
                                                    </Text>
                                                </Box>
                                            </Flex>
                                        </Box>
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
                            {asset.liquidityPools.length > 0 ? (
                                <VStack align="stretch" gap={2}>
                                    {asset.liquidityPools.map((pool, index) => (
                                        <Box
                                            key={index}
                                            p={3}
                                            bg="bg.muted"
                                            borderRadius="md"
                                        >
                                            <Text fontWeight="medium" mb={2}>{pool.name}</Text>
                                            <Grid gridTemplateColumns="repeat(3, 1fr)" gap={2}>
                                                <Box>
                                                    <Text color="fg.muted" fontSize="xs">TVL</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{pool.tvl}</Text>
                                                </Box>
                                                <Box>
                                                    <Text color="fg.muted" fontSize="xs">APR</Text>
                                                    <Text fontSize="sm" fontWeight="medium" color="green.500">{pool.apr}</Text>
                                                </Box>
                                                <Box>
                                                    <Text color="fg.muted" fontSize="xs">24h Volume</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{pool.volume24h}</Text>
                                                </Box>
                                            </Grid>
                                        </Box>
                                    ))}
                                </VStack>
                            ) : (
                                <Text color="fg.muted" fontSize="sm">No liquidity pools available</Text>
                            )}
                        </Box>

                        {/* Factory Details */}
                        {asset.type === 'factory' && asset.factoryDetails && (
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
                                            <Text fontSize="sm" fontFamily="mono">{asset.factoryDetails.creator}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Created At</Text>
                                            <Text fontSize="sm">{asset.factoryDetails.createdAt}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Current Supply</Text>
                                            <Text fontSize="sm">{asset.factoryDetails.currentSupply}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Max Supply</Text>
                                            <Text fontSize="sm">{asset.factoryDetails.maxSupply}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Features</Text>
                                            <HStack gap={2}>
                                                {asset.factoryDetails.mintable && (
                                                    <Badge colorPalette="green" size="sm">Mintable</Badge>
                                                )}
                                                {asset.factoryDetails.burnable && (
                                                    <Badge colorPalette="orange" size="sm">Burnable</Badge>
                                                )}
                                            </HStack>
                                        </Box>
                                    </Grid>
                                </Box>
                            </>
                        )}

                        {/* IBC Details */}
                        {asset.type === 'ibc' && asset.ibcDetails && (
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
                                            <Text fontSize="sm">{asset.ibcDetails.sourceChain}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Channel ID</Text>
                                            <Text fontSize="sm" fontFamily="mono">{asset.ibcDetails.channelId}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Base Denom</Text>
                                            <Text fontSize="sm" fontFamily="mono">{asset.ibcDetails.baseDenom}</Text>
                                        </Box>
                                        <Box>
                                            <Text color="fg.muted" fontSize="sm">Path</Text>
                                            <Text fontSize="sm" fontFamily="mono">{asset.ibcDetails.path}</Text>
                                        </Box>
                                        <Box gridColumn={{ base: 'span 1', sm: 'span 2' }}>
                                            <Text color="fg.muted" fontSize="sm">Last Update</Text>
                                            <Text fontSize="sm">{asset.ibcDetails.lastUpdate}</Text>
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
                        <Text fontSize="2xl" fontWeight="bold">{mockAssets.length}</Text>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Native</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {mockAssets.filter(a => a.type === 'native').length}
                        </Text>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">Factory</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {mockAssets.filter(a => a.type === 'factory').length}
                        </Text>
                    </Box>
                    <Box p={4} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.subtle">
                        <Text color="fg.muted" fontSize="sm">IBC</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {mockAssets.filter(a => a.type === 'ibc').length}
                        </Text>
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
                    {mockAssets.map(renderAssetCard)}
                </VStack>
            </VStack>
        </Container>
    )
}