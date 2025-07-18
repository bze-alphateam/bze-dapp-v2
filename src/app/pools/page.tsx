'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Container,
    Heading,
    Input,
    HStack,
    VStack,
    Text,
    Button,
    Flex,
    Badge,
    NativeSelectRoot,
    NativeSelectField
} from '@chakra-ui/react'
import { LuSearch, LuChevronUp, LuChevronDown } from 'react-icons/lu'
import Image from 'next/image'

// Mock data for liquidity pools
const mockPools = [
    {
        id: 1,
        asset1: { ticker: 'ETH', logo: '/images/bze_alternative_512x512.png' },
        asset2: { ticker: 'USDC', logo: '/images/token.svg' },
        volume24h: 15420000,
        totalLiquidity: 85300000,
        apr: 12.5
    },
    {
        id: 2,
        asset1: { ticker: 'BTC', logo: '/images/logo_320px.png' },
        asset2: { ticker: 'USDT', logo: '/images/logo_320px.png' },
        volume24h: 23150000,
        totalLiquidity: 120500000,
        apr: 8.3
    },
    {
        id: 3,
        asset1: { ticker: 'USDC', logo: '/images/token.svg' },
        asset2: { ticker: 'USDT', logo: '/images/logo_320px.png' },
        volume24h: 8750000,
        totalLiquidity: 45200000,
        apr: 3.2
    },
    {
        id: 4,
        asset1: { ticker: 'MATIC', logo: '/images/token.svg' },
        asset2: { ticker: 'ETH', logo: '/images/bze_alternative_512x512.png' },
        volume24h: 5240000,
        totalLiquidity: 28900000,
        apr: 18.7
    },
    {
        id: 5,
        asset1: { ticker: 'LINK', logo: '/images/token.svg' },
        asset2: { ticker: 'ETH', logo: '/images/bze_alternative_512x512.png' },
        volume24h: 3120000,
        totalLiquidity: 19400000,
        apr: 22.1
    },
    {
        id: 6,
        asset1: { ticker: 'UNI', logo: '/images/token.svg' },
        asset2: { ticker: 'USDC', logo: '/images/token.svg' },
        volume24h: 2850000,
        totalLiquidity: 16700000,
        apr: 15.4
    }
] as const

type Pool = typeof mockPools[number]

type SortField = 'volume24h' | 'totalLiquidity' | 'apr'
type SortOrder = 'asc' | 'desc'

const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(2)}`
}

const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
}

export default function LiquidityPoolsPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<SortField>('totalLiquidity')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const sortOptions = [
        { value: 'totalLiquidity-desc', label: 'Total Liquidity (High to Low)' },
        { value: 'totalLiquidity-asc', label: 'Total Liquidity (Low to High)' },
        { value: 'volume24h-desc', label: '24h Volume (High to Low)' },
        { value: 'volume24h-asc', label: '24h Volume (Low to High)' },
        { value: 'apr-desc', label: 'APR (High to Low)' },
        { value: 'apr-asc', label: 'APR (Low to High)' }
    ]

    const handleMobileSort = (value: string) => {
        const [field, order] = value.split('-') as [SortField, SortOrder]
        setSortField(field)
        setSortOrder(order)
    }

    const filteredAndSortedPools = useMemo(() => {
        const filtered = mockPools.filter(pool => {
            const searchLower = searchTerm.toLowerCase()
            return (
                pool.asset1.ticker.toLowerCase().includes(searchLower) ||
                pool.asset2.ticker.toLowerCase().includes(searchLower) ||
                `${pool.asset1.ticker}-${pool.asset2.ticker}`.toLowerCase().includes(searchLower)
            )
        })

        return filtered.sort((a, b) => {
            const aValue = a[sortField]
            const bValue = b[sortField]

            if (sortOrder === 'asc') {
                return aValue - bValue
            } else {
                return bValue - aValue
            }
        })
    }, [searchTerm, sortField, sortOrder])

    const handlePoolClick = (poolId: number) => {
        router.push(`/pools/${poolId}`)
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortOrder === 'asc' ? <LuChevronUp /> : <LuChevronDown />
    }

    // Mobile Card Component
    const PoolCard = ({ pool }: { pool: Pool }) => (
        <Box
            bg="bg.surface"
            p={4}
            borderRadius="l1"
            border="1px solid"
            borderColor="border.subtle"
            cursor="pointer"
            onClick={() => handlePoolClick(pool.id)}
            _hover={{ bg: "bg.muted" }}
            transition="background-color 0.2s"
            w="full"
        >
            <VStack gap={3} align="stretch">
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <HStack gap={0}>
                            <Box
                                w={10}
                                h={10}
                                borderRadius="full"
                                overflow="hidden"
                                bg="bg.surface"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                border="2px solid"
                                borderColor="border.subtle"
                            >
                                <Image
                                    src={pool.asset1.logo}
                                    alt={pool.asset1.ticker}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '50%' }}
                                />
                            </Box>
                            <Box
                                w={10}
                                h={10}
                                borderRadius="full"
                                overflow="hidden"
                                bg="bg.surface"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                ml={-2}
                                border="2px solid"
                                borderColor="border.subtle"
                            >
                                <Image
                                    src={pool.asset2.logo}
                                    alt={pool.asset2.ticker}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '50%' }}
                                />
                            </Box>
                        </HStack>
                        <VStack gap={0} align="start">
                            <Text fontWeight="600" fontSize="lg">
                                {pool.asset1.ticker}/{pool.asset2.ticker}
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                                {pool.asset1.ticker}-{pool.asset2.ticker} LP
                            </Text>
                        </VStack>
                    </HStack>
                    <Badge
                        colorPalette={pool.apr > 15 ? 'green' : pool.apr > 10 ? 'yellow' : 'blue'}
                        size="lg"
                    >
                        {formatPercentage(pool.apr)}
                    </Badge>
                </HStack>

                <HStack justify="space-between">
                    <VStack gap={1} align="start">
                        <Text fontSize="xs" color="fg.muted" fontWeight="500">
                            24h Volume
                        </Text>
                        <Text fontWeight="600" fontSize="md">
                            {formatCurrency(pool.volume24h)}
                        </Text>
                    </VStack>
                    <VStack gap={1} align="end">
                        <Text fontSize="xs" color="fg.muted" fontWeight="500">
                            Total Liquidity
                        </Text>
                        <Text fontWeight="600" fontSize="md">
                            {formatCurrency(pool.totalLiquidity)}
                        </Text>
                    </VStack>
                </HStack>

                <Button
                    size="sm"
                    variant="outline"
                    w="full"
                    onClick={(e) => {
                        e.stopPropagation()
                        handlePoolClick(pool.id)
                    }}
                >
                    View Pool
                </Button>
            </VStack>
        </Box>
    )

    return (
        <Box minH="100vh" bg="bg.panel">
            <Container maxW="7xl" py={8}>
                <VStack gap={8}>
                    <VStack gap={4}>
                        <Heading size="2xl" textAlign="center">
                            Liquidity Pools
                        </Heading>
                        <Text textAlign="center" color="fg.muted" fontSize="lg">
                            Provide liquidity to earn fees and rewards
                        </Text>
                    </VStack>

                    <Box bg="bg.surface" p={6} borderRadius="l2" shadow="sm" w="full">
                        <VStack gap={6} w="full">
                            <VStack gap={4} w="full">
                                <Box position="relative" w="full">
                                    <Input
                                        placeholder="Search pools by token symbol..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        size="lg"
                                        pl={10}
                                    />
                                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                        <LuSearch color="gray" />
                                    </Box>
                                </Box>

                                {/* Mobile Sort Select */}
                                <Box display={{ base: 'block', md: 'none' }} w="full">
                                    <VStack gap={2} align="stretch">
                                        <Text fontSize="sm" fontWeight="600" color="fg.muted">
                                            Sort by:
                                        </Text>
                                        <NativeSelectRoot>
                                            <NativeSelectField
                                                value={`${sortField}-${sortOrder}`}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMobileSort(e.target.value)}
                                                size="lg"
                                            >
                                                {sortOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </NativeSelectField>
                                        </NativeSelectRoot>
                                    </VStack>
                                </Box>
                            </VStack>

                            {/* Desktop Table View */}
                            <Box overflowX="auto" w="full" display={{ base: 'none', md: 'block' }}>
                                <Box as="table" w="full" borderCollapse="collapse">
                                    <Box as="thead">
                                        <Box as="tr">
                                            <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                Pool
                                            </Box>
                                            <Box
                                                as="th"
                                                textAlign="left"
                                                p={4}
                                                fontSize="sm"
                                                fontWeight="600"
                                                color="fg.muted"
                                                cursor="pointer"
                                                onClick={() => handleSort('volume24h')}
                                                _hover={{ bg: "bg.muted" }}
                                                borderRadius="md"
                                            >
                                                <HStack>
                                                    <Text>24h Volume</Text>
                                                    <SortIcon field="volume24h" />
                                                </HStack>
                                            </Box>
                                            <Box
                                                as="th"
                                                textAlign="left"
                                                p={4}
                                                fontSize="sm"
                                                fontWeight="600"
                                                color="fg.muted"
                                                cursor="pointer"
                                                onClick={() => handleSort('totalLiquidity')}
                                                _hover={{ bg: "bg.muted" }}
                                                borderRadius="md"
                                            >
                                                <HStack>
                                                    <Text>Total Liquidity</Text>
                                                    <SortIcon field="totalLiquidity" />
                                                </HStack>
                                            </Box>
                                            <Box
                                                as="th"
                                                textAlign="left"
                                                p={4}
                                                fontSize="sm"
                                                fontWeight="600"
                                                color="fg.muted"
                                                cursor="pointer"
                                                onClick={() => handleSort('apr')}
                                                _hover={{ bg: "bg.muted" }}
                                                borderRadius="md"
                                            >
                                                <HStack>
                                                    <Text>APR</Text>
                                                    <SortIcon field="apr" />
                                                </HStack>
                                            </Box>
                                            <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                Action
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box as="tbody">
                                        {filteredAndSortedPools.map((pool) => (
                                            <Box
                                                key={pool.id}
                                                as="tr"
                                                cursor="pointer"
                                                onClick={() => handlePoolClick(pool.id)}
                                                _hover={{ bg: "bg.muted" }}
                                                transition="background-color 0.2s"
                                            >
                                                <Box as="td" p={4}>
                                                    <HStack gap={3}>
                                                        <HStack gap={0}>
                                                            <Box
                                                                w={8}
                                                                h={8}
                                                                borderRadius="full"
                                                                overflow="hidden"
                                                                bg="bg.surface"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                border="2px solid"
                                                                borderColor="border.subtle"
                                                            >
                                                                <Image
                                                                    src={pool.asset1.logo}
                                                                    alt={pool.asset1.ticker}
                                                                    width={32}
                                                                    height={32}
                                                                    style={{ borderRadius: '50%' }}
                                                                />
                                                            </Box>
                                                            <Box
                                                                w={8}
                                                                h={8}
                                                                borderRadius="full"
                                                                overflow="hidden"
                                                                bg="bg.surface"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                ml={-2}
                                                                border="2px solid"
                                                                borderColor="border.subtle"
                                                            >
                                                                <Image
                                                                    src={pool.asset2.logo}
                                                                    alt={pool.asset2.ticker}
                                                                    width={32}
                                                                    height={32}
                                                                    style={{ borderRadius: '50%' }}
                                                                />
                                                            </Box>
                                                        </HStack>
                                                        <VStack gap={0} align="start">
                                                            <Text fontWeight="600" fontSize="md">
                                                                {pool.asset1.ticker}/{pool.asset2.ticker}
                                                            </Text>
                                                            <Text fontSize="sm" color="fg.muted">
                                                                {pool.asset1.ticker}-{pool.asset2.ticker} LP
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Box>
                                                <Box as="td" p={4}>
                                                    <Text fontWeight="600" fontSize="md">
                                                        {formatCurrency(pool.volume24h)}
                                                    </Text>
                                                </Box>
                                                <Box as="td" p={4}>
                                                    <Text fontWeight="600" fontSize="md">
                                                        {formatCurrency(pool.totalLiquidity)}
                                                    </Text>
                                                </Box>
                                                <Box as="td" p={4}>
                                                    <Badge
                                                        colorPalette={pool.apr > 15 ? 'green' : pool.apr > 10 ? 'yellow' : 'blue'}
                                                        size="sm"
                                                    >
                                                        {formatPercentage(pool.apr)}
                                                    </Badge>
                                                </Box>
                                                <Box as="td" p={4}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handlePoolClick(pool.id)
                                                        }}
                                                    >
                                                        View Pool
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Mobile Card View */}
                            <VStack gap={4} w="full" display={{ base: 'flex', md: 'none' }}>
                                {filteredAndSortedPools.map((pool) => (
                                    <PoolCard key={pool.id} pool={pool} />
                                ))}
                            </VStack>

                            {filteredAndSortedPools.length === 0 && (
                                <VStack gap={4} py={8}>
                                    <Text fontSize="lg" color="fg.muted">
                                        No pools found matching your search
                                    </Text>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear Search
                                    </Button>
                                </VStack>
                            )}
                        </VStack>
                    </Box>

                    <Flex justify="center" mt={4}>
                        <Text fontSize="sm" color="fg.muted">
                            Showing {filteredAndSortedPools.length} of {mockPools.length} pools
                        </Text>
                    </Flex>
                </VStack>
            </Container>
        </Box>
    )
}