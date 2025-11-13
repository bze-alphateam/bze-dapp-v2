'use client'

import {useState, useMemo, useCallback} from 'react'
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
    NativeSelectField,
} from '@chakra-ui/react'
import { LuSearch, LuChevronUp, LuChevronDown, LuUser } from 'react-icons/lu'
import {LPTokenLogo} from "@/components/ui/lp_token_logo";
import {ListingTitle} from "@/components/ui/listing/title";
import {useLiquidityPools} from "@/hooks/useLiquidityPools";
import {useNavigation} from "@/hooks/useNavigation";
import {LiquidityPoolSDKType} from "@bze/bzejs/bze/tradebin/store";
import {useAsset, useAssets} from "@/hooks/useAssets";
import {toBigNumber} from "@/utils/amount";


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

const DesktopLiquidityPoolCard = ({ pool, isUserPool = false }: { pool: LiquidityPoolSDKType; isUserPool?: boolean }) => {
    const {asset: baseAsset} = useAsset(pool.base)
    const {asset: quoteAsset} = useAsset(pool.quote)
    const {toLpPage} = useNavigation()

    return (<Box
        key={pool.id}
        as="tr"
        cursor="pointer"
        onClick={() => toLpPage(pool.id)}
        _hover={{ bg: "bg.muted" }}
        transition="background-color 0.2s"
        borderRadius="lg"
    >
        <Box as="td" p={4}>
            <HStack gap={3}>
                <LPTokenLogo
                    baseAssetLogo={baseAsset?.logo || ''}
                    quoteAssetLogo={quoteAsset?.logo || ''}
                    baseAssetSymbol={baseAsset?.ticker || ''}
                    quoteAssetSymbol={quoteAsset?.ticker || ''}
                    size="8"
                />
                <VStack gap={0} align="start">
                    <Text fontWeight="600" fontSize="md">
                        {baseAsset?.ticker}/{quoteAsset?.ticker}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                        {baseAsset?.ticker}-{quoteAsset?.ticker} LP
                    </Text>
                </VStack>
            </HStack>
        </Box>
        {isUserPool && (
            <Box as="td" p={4}>
                <Text fontWeight="600" fontSize="md" color="colorPalette.600">
                    {formatCurrency(232)}
                </Text>
            </Box>
        )}
        <Box as="td" p={4}>
            <Text fontWeight="600" fontSize="md">
                {formatCurrency(321)}
            </Text>
        </Box>
        <Box as="td" p={4}>
            <Text fontWeight="600" fontSize="md">
                {formatCurrency(332)}
            </Text>
        </Box>
        <Box as="td" p={4}>
            <Badge
                colorPalette={0 > 15 ? 'green' : 0 > 10 ? 'yellow' : 'blue'}
                size="sm"
            >
                {formatPercentage(32)}
            </Badge>
        </Box>
        <Box as="td" p={4}>
            <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                    e.stopPropagation()
                    toLpPage(pool.id)
                }}
            >
                {isUserPool ? "Manage Pool" : "View Pool"}
            </Button>
        </Box>
    </Box>)
}

const MobileLiquidityPoolCard = ({ pool, isUserPool = false }: { pool: LiquidityPoolSDKType; isUserPool?: boolean }) => {

    const {asset: baseAsset} = useAsset(pool.base)
    const {asset: quoteAsset} = useAsset(pool.quote)
    const {toLpPage} = useNavigation()

    return (
        <Box
            bg={"bg.surface"}
            p={4}
            borderRadius="l1"
            border="2px solid"
            borderColor={"border.subtle"}
            cursor="pointer"
            onClick={() => toLpPage(pool.id)}
            _hover={{
                bg: "bg.muted",
            }}
            transition="all 0.2s"
            w="full"
            position="relative"
        >
            <VStack gap={3} align="stretch">
                <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                        <LPTokenLogo
                            baseAssetLogo={baseAsset?.logo || ''}
                            quoteAssetLogo={quoteAsset?.logo || ''}
                            baseAssetSymbol={baseAsset?.ticker || ''}
                            quoteAssetSymbol={quoteAsset?.ticker || ''}
                            size="8"
                        />
                        <VStack gap={0} align="start">
                            <HStack>
                                <Text fontWeight="600" fontSize="lg">
                                    {baseAsset?.ticker}/{quoteAsset?.ticker}
                                </Text>
                            </HStack>
                            <Text fontSize="sm" color="fg.muted">
                                {baseAsset?.ticker}-{quoteAsset?.ticker} LP
                            </Text>
                        </VStack>
                    </HStack>
                    <Badge
                        colorPalette={0 > 15 ? 'green' : 0 > 10 ? 'yellow' : 'blue'}
                        size="lg"
                    >
                        {formatPercentage(10)}
                    </Badge>
                </HStack>

                {isUserPool && (
                    <Box bg="bg.muted" p={2} borderRadius="md">
                        <HStack justify="space-between">
                            <Text fontSize="xs" color="fg.muted" fontWeight="500">
                                My Liquidity
                            </Text>
                            <Text fontWeight="600" fontSize="sm" color="blue.600">
                                {formatCurrency(123)}
                            </Text>
                        </HStack>
                    </Box>
                )}

                <HStack justify="space-between">
                    <VStack gap={1} align="start">
                        <Text fontSize="xs" color="fg.muted" fontWeight="500">
                            24h Volume
                        </Text>
                        <Text fontWeight="600" fontSize="md">
                            {formatCurrency(1232)}
                        </Text>
                    </VStack>
                    <VStack gap={1} align="end">
                        <Text fontSize="xs" color="fg.muted" fontWeight="500">
                            Total Liquidity
                        </Text>
                        <Text fontWeight="600" fontSize="md">
                            {formatCurrency(123332)}
                        </Text>
                    </VStack>
                </HStack>

                <Button
                    size="sm"
                    variant={isUserPool ? "solid" : "outline"}
                    colorPalette={isUserPool ? "blue" : "gray"}
                    w="full"
                    onClick={(e) => {
                        e.stopPropagation()
                        toLpPage(pool.id)
                    }}
                >
                    {isUserPool ? "Manage Pool" : "View Pool"}
                </Button>
            </VStack>
        </Box>
    )
}

export default function LiquidityPoolsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortField, setSortField] = useState<SortField>('totalLiquidity')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const {pools, poolsData} = useLiquidityPools()
    const {denomTicker} = useAssets()

    const sortOptions = [
        { value: 'totalLiquidity-desc', label: 'Total Liquidity (High to Low)' },
        { value: 'totalLiquidity-asc', label: 'Total Liquidity (Low to High)' },
        { value: 'volume24h-desc', label: '24h Volume (High to Low)' },
        { value: 'volume24h-asc', label: '24h Volume (Low to High)' },
        { value: 'apr-desc', label: 'APR (High to Low)' },
        { value: 'apr-asc', label: 'APR (Low to High)' }
    ]

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const handleMobileSort = (value: string) => {
        const [field, order] = value.split('-') as [SortField, SortOrder]
        setSortField(field)
        setSortOrder(order)
    }

    const sortedPools = useMemo(() => {
        return pools.sort((poolA, poolB) => {
            const poolAData = poolsData.get(poolA.id)
            const poolBData = poolsData.get(poolB.id)
            if (!poolAData && !poolBData) return 0;
            if (!poolAData) return 1;
            if (!poolBData) return -1;

            let valueA = poolAData.usdVolume
            let valueB = poolBData.usdVolume
            if (sortField === 'totalLiquidity') {
                valueA = poolAData.usdValue
                valueB = poolBData.usdValue
            } else if (sortField === 'apr') {
                valueA = toBigNumber(poolAData.apr)
                valueB = toBigNumber(poolBData.apr)
            }

            if (sortOrder === 'asc') {
                return valueA.minus(valueB).toNumber()
            }

            return valueB.minus(valueA).toNumber()
        })
    }, [sortField, sortOrder, pools, poolsData])

    const filteredAndSortedPools = useMemo(() => {
        const filtered = sortedPools.filter(pool => {
            const searchLower = searchTerm.toLowerCase()
            const baseTicker = denomTicker(pool.base).toLowerCase()
            const quoteTicker = denomTicker(pool.quote).toLowerCase()

            return (
                baseTicker.includes(searchLower) ||
                quoteTicker.includes(searchLower) ||
                `${baseTicker}-${quoteTicker}`.toLowerCase().includes(searchLower)
            )
        })

        // Separate user pools and other pools, then combine with user pools first
        // const userPools = sorted.filter(pool => pool.isUserPool)
        const otherPools = filtered

        return { otherPools, userPools: [] as LiquidityPoolSDKType[] }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, sortedPools])

    const SortIcon = useCallback(({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortOrder === 'asc' ? <LuChevronUp /> : <LuChevronDown />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box minH="100vh">
            <Container maxW="7xl" py={8}>
                <VStack gap={8} align="stretch">
                    <ListingTitle title={"Liquidity Pools"} subtitle={"Provide liquidity to earn fees and rewards"} />

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
                                        <NativeSelectRoot w="full">
                                            <NativeSelectField
                                                value={`${sortField}-${sortOrder}`}
                                                onChange={(e) => handleMobileSort(e.target.value)}
                                                p={3}
                                                borderRadius="md"
                                                border="1px solid"
                                                borderColor="border.subtle"
                                                bg="bg.surface"
                                                fontSize="md"
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
                                {/* User Pools Section */}
                                {filteredAndSortedPools.userPools.length > 0 && (
                                    <VStack gap={4} mb={8} align="stretch">
                                        <HStack>
                                            <LuUser />
                                            <Heading size="lg" color="blue.600" _dark={{ color: "blue.300" }}>
                                                My Pools ({filteredAndSortedPools.userPools.length})
                                            </Heading>
                                        </HStack>
                                        <Box as="table" w="full" borderCollapse="collapse">
                                            <Box as="thead">
                                                <Box as="tr">
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        Pool
                                                    </Box>
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        My Liquidity
                                                    </Box>
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        24h Volume
                                                    </Box>
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        Total Liquidity
                                                    </Box>
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        APR
                                                    </Box>
                                                    <Box as="th" textAlign="left" p={4} fontSize="sm" fontWeight="600" color="fg.muted">
                                                        Action
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box as="tbody">
                                                {filteredAndSortedPools.userPools.map((pool) => (
                                                    // <Box
                                                    //     key={pool.id}
                                                    //     as="tr"
                                                    //     cursor="pointer"
                                                    //     onClick={() => handlePoolClick(pool.id)}
                                                    //     _hover={{
                                                    //         bg: "blue.50",
                                                    //         _dark: { bg: "blue.900" }
                                                    // }}
                                                    //     transition="background-color 0.2s"
                                                    //     borderRadius="lg"
                                                    //     // bg="blue.25"
                                                    //     // _dark={{ bg: "blue.950" }}
                                                    // >
                                                    //     <Box as="td" p={4}>
                                                    //         <HStack gap={3}>
                                                    //             <HStack gap={0}>
                                                    //                 <TokenLogo
                                                    //                     src={pool.asset1.logo}
                                                    //                     symbol={pool.asset1.ticker}
                                                    //                     size="8"
                                                    //                     circular={true}
                                                    //                 />
                                                    //                 <Box
                                                    //                     ml={-2}
                                                    //                     alignItems="center"
                                                    //                     justifyContent="center"
                                                    //                     position="relative"
                                                    //                 >
                                                    //                     <TokenLogo
                                                    //                         src={pool.asset2.logo}
                                                    //                         symbol={pool.asset2.ticker}
                                                    //                         size="8"
                                                    //                         circular={true}
                                                    //                     />
                                                    //                 </Box>
                                                    //             </HStack>
                                                    //             <VStack gap={0} align="start">
                                                    //                 <HStack>
                                                    //                     <Text fontWeight="600" fontSize="md">
                                                    //                         {pool.asset1.ticker}/{pool.asset2.ticker}
                                                    //                     </Text>
                                                    //                     <Badge colorPalette="blue" size="sm">
                                                    //                         My Pool
                                                    //                     </Badge>
                                                    //                 </HStack>
                                                    //                 <Text fontSize="sm" color="fg.muted">
                                                    //                     {pool.asset1.ticker}-{pool.asset2.ticker} LP
                                                    //                 </Text>
                                                    //             </VStack>
                                                    //         </HStack>
                                                    //     </Box>
                                                    //     <Box as="td" p={4}>
                                                    //         <Text fontWeight="600" fontSize="md" color="colorPalette.600">
                                                    //             {pool.userLiquidity ? formatCurrency(pool.userLiquidity) : '-'}
                                                    //         </Text>
                                                    //     </Box>
                                                    //     <Box as="td" p={4}>
                                                    //         <Text fontWeight="600" fontSize="md">
                                                    //             {formatCurrency(pool.volume24h)}
                                                    //         </Text>
                                                    //     </Box>
                                                    //     <Box as="td" p={4}>
                                                    //         <Text fontWeight="600" fontSize="md">
                                                    //             {formatCurrency(pool.totalLiquidity)}
                                                    //         </Text>
                                                    //     </Box>
                                                    //     <Box as="td" p={4}>
                                                    //         <Badge
                                                    //             colorPalette={pool.apr > 15 ? 'green' : pool.apr > 10 ? 'yellow' : 'blue'}
                                                    //             size="sm"
                                                    //         >
                                                    //             {formatPercentage(pool.apr)}
                                                    //         </Badge>
                                                    //     </Box>
                                                    //     <Box as="td" p={4}>
                                                    //         <Button
                                                    //             size="sm"
                                                    //             variant="solid"
                                                    //             colorPalette="blue"
                                                    //             onClick={(e) => {
                                                    //                 e.stopPropagation()
                                                    //                 handlePoolClick(pool.id)
                                                    //             }}
                                                    //         >
                                                    //             Manage
                                                    //         </Button>
                                                    //     </Box>
                                                    // </Box>
                                                    <DesktopLiquidityPoolCard pool={pool} isUserPool={false} key={pool.id} />
                                                ))}
                                            </Box>
                                        </Box>
                                    </VStack>
                                )}

                                {/* All Pools Section */}
                                {filteredAndSortedPools.otherPools.length > 0 && (
                                    <VStack gap={4} align="stretch">
                                        <Heading size="lg">
                                            All Pools ({filteredAndSortedPools.otherPools.length})
                                        </Heading>
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
                                                {filteredAndSortedPools.otherPools.map((pool) => (
                                                    <DesktopLiquidityPoolCard key={pool.id} pool={pool} isUserPool={false} />
                                                ))}
                                            </Box>
                                        </Box>
                                    </VStack>
                                )}
                            </Box>

                            {/* Mobile Card View */}
                            <Box w="full" display={{ base: 'block', md: 'none' }}>
                                {/* User Pools Section - Mobile */}
                                {filteredAndSortedPools.userPools.length > 0 && (
                                    <VStack gap={4} mb={6} align="stretch">
                                        <HStack>
                                            <Heading size="lg" color="blue.600" _dark={{ color: "blue.300" }}>
                                                My Pools ({filteredAndSortedPools.userPools.length})
                                            </Heading>
                                        </HStack>
                                        <VStack gap={3} w="full">
                                            {filteredAndSortedPools.userPools.map((pool) => (
                                                <MobileLiquidityPoolCard key={pool.id} pool={pool} isUserPool={true} />
                                            ))}
                                        </VStack>
                                    </VStack>
                                )}

                                {/* All Pools Section - Mobile */}
                                {filteredAndSortedPools.otherPools.length > 0 && (
                                    <VStack gap={4} align="stretch">
                                        <Heading size="lg">
                                            All Pools ({filteredAndSortedPools.otherPools.length})
                                        </Heading>
                                        <VStack gap={3} w="full">
                                            {filteredAndSortedPools.otherPools.map((pool) => (
                                                <MobileLiquidityPoolCard key={pool.id} pool={pool} isUserPool={false} />
                                            ))}
                                        </VStack>
                                    </VStack>
                                )}
                            </Box>

                            {(filteredAndSortedPools.userPools.length === 0 && filteredAndSortedPools.otherPools.length === 0) && (
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
                            Showing {filteredAndSortedPools.userPools.length + filteredAndSortedPools.otherPools.length} of {pools.length} pools
                            {filteredAndSortedPools.userPools.length > 0 && (
                                <Text as="span" color="blue.600" _dark={{ color: "blue.300" }} fontWeight="600">
                                    {" "}• {filteredAndSortedPools.userPools.length} My Pools
                                </Text>
                            )}
                        </Text>
                    </Flex>
                </VStack>
            </Container>
        </Box>
    )
}