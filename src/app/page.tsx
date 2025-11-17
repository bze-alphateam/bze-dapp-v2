'use client';

import {
  Box,
  Button,
  Card,
  Container,
  HStack,
  VStack,
  Text,
  Input,
  Switch,
  Collapsible,
  Badge,
  Flex,
  Select,
  createListCollection,
  Alert,
} from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import {
  LuArrowUpDown,
  LuSettings,
  LuChevronDown,
  LuChevronUp,
  LuArrowRight, LuInfo,
} from 'react-icons/lu';
import { useState, useMemo, memo, useEffect } from 'react';
import {TokenLogo} from "@/components/ui/token_logo";
import { useAssets } from '@/hooks/useAssets';
import { useBalances } from '@/hooks/useBalances';
import { useLiquidityPools } from '@/hooks/useLiquidityPools';
import {prettyAmount, uAmountToBigNumberAmount, amountToBigNumberUAmount, toBigNumber} from '@/utils/amount';
import BigNumber from 'bignumber.js';
import { ammRouter } from '@/service/amm_router';
import { SwapRouteResult } from '@/types/liquidity_pool';

const slippagePresets = [1, 2, 5];

// Define the asset type for better type safety
type AssetWithBalance = {
  denom: string;
  ticker: string;
  name: string;
  logo: string;
  balance: BigNumber;
  balanceFormatted: string;
  verified: boolean;
  decimals: number;
  type: string;
  stable: boolean;
  supply: bigint;
};

// Memoized AssetSelector component to prevent unnecessary re-renders
const AssetSelector = memo(({
  asset,
  onSelect,
  placeholder,
  assetsWithBalanceInfo,
}: {
  asset: AssetWithBalance | null;
  onSelect: (asset: AssetWithBalance) => void;
  placeholder: string;
  assetsWithBalanceInfo: AssetWithBalance[];
}) => {
  // Local search state to avoid parent re-renders
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Memoize filtered assets to prevent unnecessary recalculations
  const filteredAssets = useMemo(() => {
    if (!searchTerm) {
      // Show only first 10 by default (already sorted)
      return assetsWithBalanceInfo.slice(0, 10);
    }

    // When searching, filter and show up to 20 results
    const filtered = assetsWithBalanceInfo.filter((a) =>
        a.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.slice(0, 20);
  }, [searchTerm, assetsWithBalanceInfo]);

  // Memoize collection to prevent flickering on search
  const collection = useMemo(() => {
    return createListCollection({
      items: filteredAssets.map((a) => ({
        label: a.ticker,
        value: a.denom
      }))
    });
  }, [filteredAssets]);

  if (!asset) {
    return <Box>Loading...</Box>;
  }

  return (
      <Select.Root
          collection={collection}
          value={[asset.denom]}
          open={isOpen}
          onOpenChange={(details) => {
            setIsOpen(details.open);
            if (!details.open) {
              setSearchTerm('');
            }
          }}
          onValueChange={(details) => {
            const selectedDenom = details.value[0];
            const selectedAsset = assetsWithBalanceInfo.find((a) => a.denom === selectedDenom);
            if (selectedAsset) {
              onSelect(selectedAsset);
              setIsOpen(false);
              setSearchTerm('');
            }
          }}
      >
        <Select.Trigger asChild>
          <Card.Root variant="outline" p="4" cursor="pointer">
            <VStack align="start" gap="3" w="full">
              <Text fontSize="sm" color="fg.muted">
                {placeholder}
              </Text>
              <HStack justify="space-between" w="full">
                <HStack gap="3">
                  <TokenLogo
                      src={asset.logo}
                      symbol={asset.ticker}
                      size="8"
                      circular={true}
                  />
                  <VStack align="start" gap="1">
                    <HStack gap="2">
                      <Text fontWeight="bold" fontSize="lg">
                        {asset.ticker}
                      </Text>
                      <Text fontSize="md" color="fg.muted">
                        {asset.name}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="fg.muted">
                      Balance: {asset.balanceFormatted}
                    </Text>
                  </VStack>
                </HStack>
                <LuChevronDown />
              </HStack>
            </VStack>
          </Card.Root>
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content maxH="400px" overflowY="auto" background={"bg.muted"}>
            <Box p="3" borderBottomWidth="1px">
              <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  autoFocus
              />
            </Box>
            <Box maxH="300px" overflowY="auto">
              {filteredAssets.length > 0 ? (
                  filteredAssets.map((assetOption) => (
                      <Select.Item
                          key={assetOption.denom}
                          item={assetOption.denom}
                          cursor="pointer"
                          _hover={{ bg: "bg.panel" }}
                      >
                        <Select.ItemText>
                          <HStack gap="3" py="2">
                            <TokenLogo
                                src={assetOption.logo}
                                symbol={assetOption.ticker}
                                size="8"
                                circular={true}
                            />
                            <VStack align="start" gap="0" flex="1">
                              <HStack gap={2} w="full">
                                <Text fontWeight="medium" fontSize="md">
                                  {assetOption.ticker}
                                </Text>
                                <Text fontSize="sm" color="fg.muted">
                                  {assetOption.name}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="fg.muted">
                                Balance: {assetOption.balanceFormatted}
                              </Text>
                            </VStack>
                          </HStack>
                        </Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                  ))
              ) : (
                  <Box p="4" textAlign="center">
                    <Text fontSize="sm" color="fg.muted">
                      No assets found
                    </Text>
                  </Box>
              )}
            </Box>
            {!searchTerm && assetsWithBalanceInfo.length > 10 && (
                <Box p="2" borderTopWidth="1px" textAlign="center">
                  <Text fontSize="xs" color="fg.muted">
                    Showing first 10 assets. Search to find more.
                  </Text>
                </Box>
            )}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
  );
});

AssetSelector.displayName = 'AssetSelector';

export default function SwapPage() {
  const { assetsLpExcluded, denomTicker, getAsset } = useAssets();
  const { getBalanceByDenom } = useBalances();
  const { pools } = useLiquidityPools();

  // Update AMM router whenever pools change
  useEffect(() => {
    if (pools && pools.length > 0) {
      ammRouter.updatePools(pools);
    }
  }, [pools]);

  // Get assets with balance information for display
  const assetsWithBalanceInfo = useMemo(() => {
    const assetsWithBalance = assetsLpExcluded.map(asset => {
      const balance = getBalanceByDenom(asset.denom);
      const balanceAmount = uAmountToBigNumberAmount(balance.amount, asset.decimals);
      return {
        ...asset,
        balance: balanceAmount,
        balanceFormatted: prettyAmount(balanceAmount)
      };
    });

    // Sort assets by:
    // 1. Positive balance first (alphabetically)
    // 2. Then verified assets
    // 3. Then assets without "..." in name
    // 4. Finally assets with "..." in name
    return assetsWithBalance.sort((a, b) => {
      const aHasBalance = a.balance.gt(0);
      const bHasBalance = b.balance.gt(0);

      // First priority: assets with balance
      if (aHasBalance && !bHasBalance) return -1;
      if (!aHasBalance && bHasBalance) return 1;

      // If both have balance or both don't, sort alphabetically within this group
      if (aHasBalance === bHasBalance) {
        // Second priority: verified flag
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;

        // Third priority: assets without "..." in name
        const aHasDots = a.name.includes('...');
        const bHasDots = b.name.includes('...');
        if (!aHasDots && bHasDots) return -1;
        if (aHasDots && !bHasDots) return 1;

        // Finally, sort alphabetically by ticker
        return a.ticker.localeCompare(b.ticker);
      }

      return 0;
    });
  }, [assetsLpExcluded, getBalanceByDenom]);

  const [fromAsset, setFromAsset] = useState<typeof assetsWithBalanceInfo[0] | null>(null);
  const [toAsset, setToAsset] = useState<typeof assetsWithBalanceInfo[0] | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [slippage, setSlippage] = useState(2);
  const [customSlippage, setCustomSlippage] = useState('');
  const [useOrderBook, setUseOrderBook] = useState(true);
  const [routeResult, setRouteResult] = useState<SwapRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Set default assets once they're loaded
  useMemo(() => {
    if (assetsWithBalanceInfo.length > 0 && !fromAsset) {
      setFromAsset(assetsWithBalanceInfo[0]);
    }
    if (assetsWithBalanceInfo.length > 1 && !toAsset) {
      setToAsset(assetsWithBalanceInfo[1]);
    }
  }, [assetsWithBalanceInfo, fromAsset, toAsset]);

  // Find optimal route when inputs change
  useEffect(() => {
    // Reset route and output if no valid input
    if (!fromAsset || !toAsset || !fromAmount) {
      setRouteResult(null);
      setToAmount('');
      return;
    }

    // Don't calculate if same asset
    if (fromAsset.denom === toAsset.denom) {
      setRouteResult(null);
      setToAmount('');
      return;
    }

    // Parse and validate amount
    const amount = toBigNumber(fromAmount);
    if (amount.isNaN() || amount.lte(0)) {
      setRouteResult(null);
      setToAmount('');
      return;
    }

    // Convert human-readable amount to micro amount
    const amountInMicro = amountToBigNumberUAmount(amount, fromAsset.decimals);

    setIsCalculatingRoute(true);

    // Find optimal route (async to not block UI)
    setTimeout(() => {
      try {
        const route = ammRouter.findOptimalRoute(
          fromAsset.denom,
          toAsset.denom,
          amountInMicro,
          3, // max 3 hops
          true // use cache
        );

        if (route) {
          setRouteResult(route);
          // Convert expected output from micro to human-readable
          const outputAmount = uAmountToBigNumberAmount(route.expectedOutput, toAsset.decimals);
          setToAmount(outputAmount.toString());
        } else {
          setRouteResult(null);
          setToAmount('');
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        setRouteResult(null);
        setToAmount('');
      } finally {
        setIsCalculatingRoute(false);
      }
    }, 0);
  }, [fromAsset, toAsset, fromAmount]);

  // Check if user has sufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!fromAsset || !fromAmount) return false;
    const amount = new BigNumber(fromAmount);
    if (amount.isNaN() || amount.lte(0)) return false;
    return amount.gt(fromAsset.balance);
  }, [fromAsset, fromAmount]);

  // Determine if swap can be submitted
  const canSubmit = useMemo(() => {
    // Must have valid amount
    if (!fromAmount) return false;
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return false;

    // Must have selected different assets
    if (!fromAsset || !toAsset) return false;
    if (fromAsset.denom === toAsset.denom) return false;

    // Must have sufficient balance
    if (hasInsufficientBalance) return false;

    // Must have a valid route
    if (!routeResult) return false;

    // Must not be calculating
    if (isCalculatingRoute) return false;

    return true;
  }, [fromAmount, fromAsset, toAsset, hasInsufficientBalance, routeResult, isCalculatingRoute]);

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSlippagePreset = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  };

  const handleSwapSubmit = async () => {
    // TODO: Implement swap message submission
    // This function will:
    // 1. Convert fromAmount to micro amount
    // 2. Calculate minimum output based on slippage tolerance
    // 3. Create swap message(s) based on routeResult.route (pool IDs)
    // 4. Sign and broadcast transaction
    // 5. Handle success/error states

    if (!fromAsset || !toAsset || !routeResult || !fromAmount) {
      console.error('Missing required data for swap');
      return;
    }

    console.log('Swap parameters:', {
      fromAsset: fromAsset.ticker,
      toAsset: toAsset.ticker,
      fromAmount,
      expectedOutput: routeResult.expectedOutput.toString(),
      route: routeResult.route,
      path: routeResult.path,
      slippage,
      priceImpact: routeResult.priceImpact.toString()
    });

    // Message submission will be implemented here
  };

  const calculateUSDValue = (amount: string, asset: typeof assetsWithBalanceInfo[0] | null) => {
    // TODO: Integrate with USD price data from context
    // For now, return null until USD pricing is available
    if (!asset) return null;
    return null;
  };

  return (
      <Box minH="100vh" bg="bg.subtle">
        <Container maxW="lg" py="12">
          <VStack gap="6" align="stretch">
            {/* Page Header */}
            <VStack gap="2" align="center" mb="4">
              <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight">
                Swap Assets
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Trade tokens instantly with the best rates
              </Text>
            </VStack>

            {/* Swap Form */}
            <Card.Root
              maxW="480px"
              mx="auto"
              w="full"
              borderWidth="1px"
              shadow="lg"
            >
              <VStack gap="1" align="stretch">
                {/* Header with Settings */}
                <HStack justify="space-between" align="center" px="6" pt="6" pb="4">
                  <Text fontSize="lg" fontWeight="semibold">
                    Swap
                  </Text>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      colorPalette="gray"
                  >
                    <LuSettings />
                  </Button>
                </HStack>

                {/* Settings Panel */}
                <Collapsible.Root open={showSettings}>
                  <Collapsible.Content>
                    <Box px="6" pb="4">
                      <Card.Root variant="subtle" p="4">
                        <VStack gap="4" align="stretch">
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb="3" color="fg.muted">
                              Max Slippage: <Text as="span" color="fg.default">{slippage}%</Text>
                            </Text>
                            <HStack gap="2" mb="3" flexWrap="wrap">
                              {slippagePresets.map((preset) => (
                                  <Button
                                      key={preset}
                                      size="sm"
                                      variant={slippage === preset && !customSlippage ? "solid" : "outline"}
                                      onClick={() => handleSlippagePreset(preset)}
                                      colorPalette={slippage === preset && !customSlippage ? "blue" : "gray"}
                                  >
                                    {preset}%
                                  </Button>
                              ))}
                            </HStack>
                            <Input
                                placeholder="Custom %"
                                value={customSlippage}
                                onChange={(e) => handleCustomSlippage(e.target.value)}
                                size="sm"
                                type="number"
                                min="0"
                                max="50"
                                step="0.1"
                            />
                          </Box>

                          <HStack justify="space-between" align="center" pt="2">
                            <Tooltip
                                content="The app will try to match order book pairs for best prices"
                                showArrow
                            >
                              <HStack gap="2">
                                <LuInfo size={16} />
                                <Text fontSize="sm" fontWeight="medium">Use Order Book</Text>
                              </HStack>
                            </Tooltip>
                            <Switch.Root
                                checked={useOrderBook}
                                onCheckedChange={(details) => {
                                  console.log('Switch changed:', details);
                                  setUseOrderBook(details.checked);
                                }}
                                colorPalette="blue"
                            >
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              <Switch.HiddenInput />
                            </Switch.Root>
                          </HStack>
                        </VStack>
                      </Card.Root>
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>

                {/* From Asset */}
                <Box px="6" py="2">
                  <VStack gap="3" align="stretch">
                    <AssetSelector
                        asset={fromAsset}
                        onSelect={setFromAsset}
                        placeholder="From"
                        assetsWithBalanceInfo={assetsWithBalanceInfo}
                    />
                    <Box
                      bg="bg.muted"
                      borderRadius="lg"
                      p="4"
                      borderWidth="1px"
                      borderColor="border.subtle"
                    >
                      <Input
                          placeholder="0.0"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          fontSize="2xl"
                          fontWeight="semibold"
                          textAlign="right"
                          variant="flushed"
                          border="none"
                          px="0"
                          _focus={{ border: "none" }}
                      />
                      {fromAmount && calculateUSDValue(fromAmount, fromAsset) && (
                          <Text fontSize="sm" color="fg.muted" textAlign="right" mt="1">
                            ≈ ${calculateUSDValue(fromAmount, fromAsset)} USD
                          </Text>
                      )}
                    </Box>
                  </VStack>
                </Box>

                {/* Swap Button */}
                <Flex justify="center" position="relative" my="-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSwapAssets}
                      borderRadius="full"
                      p="2"
                      h="10"
                      w="10"
                      bg="bg.panel"
                      borderWidth="4px"
                      borderColor="bg.panel"
                      shadow="sm"
                      _hover={{
                        transform: "rotate(180deg)",
                        transition: "transform 0.3s ease"
                      }}
                      transition="transform 0.3s ease"
                  >
                    <LuArrowUpDown />
                  </Button>
                </Flex>

                {/* To Asset */}
                <Box px="6" py="2">
                  <VStack gap="3" align="stretch">
                    <AssetSelector
                        asset={toAsset}
                        onSelect={setToAsset}
                        placeholder="To"
                        assetsWithBalanceInfo={assetsWithBalanceInfo}
                    />
                    <Box
                      bg="bg.muted"
                      borderRadius="lg"
                      p="4"
                      borderWidth="1px"
                      borderColor="border.subtle"
                    >
                      <Input
                          placeholder="0.0"
                          value={toAmount}
                          onChange={(e) => setToAmount(e.target.value)}
                          fontSize="2xl"
                          fontWeight="semibold"
                          textAlign="right"
                          variant="flushed"
                          border="none"
                          px="0"
                          _focus={{ border: "none" }}
                      />
                      {toAmount && calculateUSDValue(toAmount, toAsset) && (
                          <Text fontSize="sm" color="fg.muted" textAlign="right" mt="1">
                            ≈ ${calculateUSDValue(toAmount, toAsset)} USD
                          </Text>
                      )}
                    </Box>
                  </VStack>
                </Box>

                {/* Estimated Output & Price Impact */}
                {fromAmount && routeResult && (
                    <Box px="6" pt="2">
                      <Card.Root variant="subtle" p="4" borderRadius="lg">
                        <VStack gap="3" align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                              Estimated Output
                            </Text>
                            <Text fontSize="sm" fontWeight="semibold">
                              {prettyAmount(uAmountToBigNumberAmount(routeResult.expectedOutput, toAsset?.decimals || 6))} {toAsset?.ticker || ''}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                              Price Impact
                            </Text>
                            <Badge
                              colorPalette={routeResult.priceImpact.gt(1) ? 'red' : routeResult.priceImpact.gt(0.5) ? 'yellow' : 'green'}
                              variant="subtle"
                            >
                              {routeResult.priceImpact.toFixed(2)}%
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                              Total Fees
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {prettyAmount(uAmountToBigNumberAmount(routeResult.totalFees, toAsset?.decimals || 6))} {toAsset?.ticker || ''}
                            </Text>
                          </HStack>
                        </VStack>
                      </Card.Root>
                    </Box>
                )}
                {fromAmount && isCalculatingRoute && (
                    <Box px="6" pt="2">
                      <Card.Root variant="subtle" p="4" borderRadius="lg">
                        <Text fontSize="sm" color="fg.muted" textAlign="center">
                          Calculating best route...
                        </Text>
                      </Card.Root>
                    </Box>
                )}
                {fromAmount && !isCalculatingRoute && !routeResult && (
                    <Box px="6" pt="2">
                      <Alert.Root status="warning">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>No Route Found</Alert.Title>
                          <Alert.Description>
                            No available liquidity pools to swap these assets
                          </Alert.Description>
                        </Alert.Content>
                      </Alert.Root>
                    </Box>
                )}

                {/* Routes Section */}
                {fromAmount && routeResult && (
                    <Box px="6">
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRoutes(!showRoutes)}
                          w="full"
                          justifyContent="space-between"
                          colorPalette="gray"
                      >
                        <Text fontSize="sm" fontWeight="medium">Trade Route ({routeResult.pools.length} hop{routeResult.pools.length > 1 ? 's' : ''})</Text>
                        {showRoutes ? <LuChevronUp size={18} /> : <LuChevronDown size={18} />}
                      </Button>

                      <Collapsible.Root open={showRoutes}>
                        <Collapsible.Content>
                          <Box mt="3">
                            <Card.Root variant="subtle" p="3">
                              {/* Route Path */}
                              <Flex wrap="wrap" gap="2" align="center" justify="center">
                                {routeResult.path.map((denom, index) => {
                                  const asset = getAsset(denom);
                                  const isLast = index === routeResult.path.length - 1;
                                  const pool = !isLast ? routeResult.pools[index] : null;

                                  return (
                                    <Flex key={index} align="center" gap="2">
                                      {/* Asset */}
                                      <Tooltip
                                        content={`${asset?.name || denomTicker(denom)}${pool ? ` → Pool ${denomTicker(pool.base)}/${denomTicker(pool.quote)}` : ''}`}
                                        showArrow
                                      >
                                        <HStack
                                          gap="1.5"
                                          px="2"
                                          py="1.5"
                                          borderRadius="md"
                                          borderWidth="1px"
                                          bg="bg.panel"
                                          _hover={{ bg: "bg.muted" }}
                                          transition="background 0.2s"
                                        >
                                          <TokenLogo
                                            src={asset?.logo || ''}
                                            symbol={denomTicker(denom)}
                                            size="6"
                                            circular={true}
                                          />
                                          <Text fontSize="sm" fontWeight="medium">
                                            {denomTicker(denom)}
                                          </Text>
                                        </HStack>
                                      </Tooltip>

                                      {/* Arrow with pool info */}
                                      {!isLast && pool && (
                                        <VStack gap="0" align="center">
                                          <Box color="fg.muted">
                                            <LuArrowRight size={16} />
                                          </Box>
                                          <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                                            {toBigNumber(pool.fee).multipliedBy(100).toFixed(2)}%
                                          </Text>
                                        </VStack>
                                      )}
                                    </Flex>
                                  );
                                })}
                              </Flex>
                            </Card.Root>
                          </Box>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                )}

                {/* Insufficient Balance Warning */}
                {hasInsufficientBalance && (
                    <Box px="6" pt="2">
                      <Alert.Root status="error">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>Insufficient Balance</Alert.Title>
                          <Alert.Description>
                            You have {fromAsset?.balanceFormatted || '0'} {fromAsset?.ticker || ''}
                          </Alert.Description>
                        </Alert.Content>
                      </Alert.Root>
                    </Box>
                )}

                {/* Swap Button */}
                <Box px="6" pt="4" pb="6">
                  <Button
                      size="xl"
                      w="full"
                      disabled={!canSubmit}
                      onClick={handleSwapSubmit}
                      colorPalette="blue"
                      fontSize="lg"
                      fontWeight="bold"
                      h="14"
                      borderRadius="xl"
                  >
                    {!fromAmount
                      ? 'Enter Amount'
                      : isCalculatingRoute
                        ? 'Finding Route...'
                        : !routeResult
                          ? 'No Route Available'
                          : 'Swap'}
                  </Button>
                </Box>
              </VStack>
            </Card.Root>
          </VStack>
        </Container>
      </Box>
  );
}