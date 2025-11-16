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
  Spacer,
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
import { useState, useMemo, memo } from 'react';
import {TokenLogo} from "@/components/ui/token_logo";
import { useAssets } from '@/hooks/useAssets';
import { useBalances } from '@/hooks/useBalances';
import {prettyAmount, uAmountToBigNumberAmount} from '@/utils/amount';
import BigNumber from 'bignumber.js';

interface Route {
  type: 'LP' | 'OrderBook';
  percentage: number;
  amount: string;
  pools?: string[];
}

const mockRoutes: Route[] = [
  {
    type: 'LP',
    percentage: 70,
    amount: '700.00',
    pools: ['BZE/USDT Pool', 'Multi-hop Pool'],
  },
  {
    type: 'OrderBook',
    percentage: 30,
    amount: '300.00',
  },
];

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
          <Select.Content maxH="400px" overflowY="auto">
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
                          _hover={{ bg: "bg.muted" }}
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
  const { assetsLpExcluded } = useAssets();
  const { getBalanceByDenom } = useBalances();

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
  const [estimatedOutput] = useState('985.43');
  const [priceImpact] = useState('0.15');

  // Set default assets once they're loaded
  useMemo(() => {
    if (assetsWithBalanceInfo.length > 0 && !fromAsset) {
      setFromAsset(assetsWithBalanceInfo[0]);
    }
    if (assetsWithBalanceInfo.length > 1 && !toAsset) {
      setToAsset(assetsWithBalanceInfo[1]);
    }
  }, [assetsWithBalanceInfo, fromAsset, toAsset]);

  // Check if user has sufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!fromAsset || !fromAmount) return false;
    const amount = new BigNumber(fromAmount);
    if (amount.isNaN() || amount.lte(0)) return false;
    return amount.gt(fromAsset.balance);
  }, [fromAsset, fromAmount]);

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

  const calculateUSDValue = (amount: string, asset: typeof assetsWithBalanceInfo[0] | null) => {
    // TODO: Integrate with USD price data from context
    // For now, return null until USD pricing is available
    if (!asset) return null;
    return null;
  };


  const RouteItem = ({ route }: { route: Route }) => (
      <Card.Root variant="subtle" p="3">
        <VStack align="start" gap="2">
          <HStack justify="space-between" w="full">
            <Badge
                colorScheme={route.type === 'LP' ? 'blue' : 'green'}
                variant="subtle"
            >
              {route.type}
            </Badge>
            <Text fontSize="sm" fontWeight="medium">
              {route.percentage}%
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Amount: {route.amount} {toAsset?.ticker || ''}
          </Text>
          {route.pools && (
              <VStack align="start" gap="1">
                {route.pools.map((pool, index) => (
                    <HStack key={index} fontSize="xs" color="fg.muted">
                      <Text>{pool}</Text>
                      {index < route.pools!.length - 1 && <LuArrowRight size={12} />}
                    </HStack>
                ))}
              </VStack>
          )}
        </VStack>
      </Card.Root>
  );

  return (
      <Box minH="100vh">
        <Container maxW="md" py="8">
          <VStack gap="8" align="stretch">
            {/* Swap Form */}
            <Card.Root p="6">
              <VStack gap="4" align="stretch">
                {/* Header with Settings */}
                <HStack justify="space-between" align="center">
                  <Text fontSize="xl" fontWeight="bold">
                    Swap
                  </Text>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                  >
                    <LuSettings />
                  </Button>
                </HStack>

                {/* Settings Panel */}
                <Collapsible.Root open={showSettings}>
                  <Collapsible.Content>
                    <Card.Root variant="subtle" p="4" mb="4">
                      <VStack gap="4" align="stretch">
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb="3">
                            Max Slippage: {slippage}%
                          </Text>
                          <HStack gap="2" mb="3" flexWrap="wrap">
                            {slippagePresets.map((preset) => (
                                <Button
                                    key={preset}
                                    size="sm"
                                    variant={slippage === preset && !customSlippage ? "solid" : "outline"}
                                    onClick={() => handleSlippagePreset(preset)}
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

                        <HStack justify="space-between" align="center">
                          <Tooltip
                              content="The app will try to match order book pairs for best prices"
                              showArrow
                          >
                            <Box display={'flex'} flexDirection="row" alignContent={"center"} alignItems={"center"}>
                              <LuInfo />
                              <Spacer />
                              <Text fontSize="sm" fontWeight="medium">Use Order Book</Text>
                            </Box>
                          </Tooltip>
                            <Switch.Root
                                checked={useOrderBook}
                                onCheckedChange={(details) => {
                                  console.log('Switch changed:', details);
                                  setUseOrderBook(details.checked);
                                }}
                            >
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              <Switch.HiddenInput />
                            </Switch.Root>
                        </HStack>
                      </VStack>
                    </Card.Root>
                  </Collapsible.Content>
                </Collapsible.Root>

                {/* From Asset */}
                <Box>
                  <AssetSelector
                      asset={fromAsset}
                      onSelect={setFromAsset}
                      placeholder="From"
                      assetsWithBalanceInfo={assetsWithBalanceInfo}
                  />
                  <VStack gap="1" align="stretch" mt="2">
                    <Input
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        fontSize="lg"
                        textAlign="right"
                    />
                    {fromAmount && calculateUSDValue(fromAmount, fromAsset) && (
                        <Text fontSize="sm" color="fg.muted" textAlign="right">
                          ≈ ${calculateUSDValue(fromAmount, fromAsset)} USD
                        </Text>
                    )}
                  </VStack>
                </Box>

                {/* Swap Button */}
                <Flex justify="center">
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSwapAssets}
                      p="2"
                      borderRadius="full"
                      border="1px solid"
                      borderColor="border"
                      bg="bg.panel"
                  >
                    <LuArrowUpDown />
                  </Button>
                </Flex>

                {/* To Asset */}
                <Box>
                  <AssetSelector
                      asset={toAsset}
                      onSelect={setToAsset}
                      placeholder="To"
                      assetsWithBalanceInfo={assetsWithBalanceInfo}
                  />
                  <VStack gap="1" align="stretch" mt="2">
                    <Input
                        placeholder="0.0"
                        value={toAmount}
                        onChange={(e) => setToAmount(e.target.value)}
                        fontSize="lg"
                        textAlign="right"
                    />
                    {toAmount && calculateUSDValue(toAmount, toAsset) && (
                        <Text fontSize="sm" color="fg.muted" textAlign="right">
                          ≈ ${calculateUSDValue(toAmount, toAsset)} USD
                        </Text>
                    )}
                  </VStack>
                </Box>

                {/* Estimated Output & Price Impact */}
                {fromAmount && (
                    <Card.Root variant="subtle" p="3">
                      <VStack gap="2" align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="fg.muted">
                            Estimated Output
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {estimatedOutput} {toAsset?.ticker || ''}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="fg.muted">
                            Price Impact
                          </Text>
                          <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={parseFloat(priceImpact) > 1 ? 'red.500' : 'green.500'}
                          >
                            {priceImpact}%
                          </Text>
                        </HStack>
                      </VStack>
                    </Card.Root>
                )}

                {/* Routes Section */}
                {fromAmount && (
                    <Box>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRoutes(!showRoutes)}
                          w="full"
                          justifyContent="space-between"
                      >
                        <Text fontSize="sm">Trade Routes</Text>
                        {showRoutes ? <LuChevronUp /> : <LuChevronDown />}
                      </Button>

                      <Collapsible.Root open={showRoutes}>
                        <Collapsible.Content>
                          <VStack gap="3" mt="3" align="stretch">
                            <Text fontSize="sm" color="fg.muted" textAlign="center">
                              Your trade will be split across:
                            </Text>
                            {mockRoutes.map((route, index) => (
                                <RouteItem key={index} route={route} />
                            ))}
                          </VStack>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    </Box>
                )}

                {/* Insufficient Balance Warning */}
                {hasInsufficientBalance && (
                    <Alert.Root status="error">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Insufficient Balance</Alert.Title>
                        <Alert.Description>
                          You have {fromAsset?.balanceFormatted || '0'} {fromAsset?.ticker || ''}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                )}

                {/* Swap Button */}
                <Button
                    size="lg"
                    disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                    mt="2"
                >
                  {!fromAmount ? 'Enter Amount' : 'Swap'}
                </Button>
              </VStack>
            </Card.Root>
          </VStack>
        </Container>
      </Box>
  );
}