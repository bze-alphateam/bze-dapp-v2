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
  Spacer, createListCollection,
} from '@chakra-ui/react';
import { Tooltip } from '@/components/ui/tooltip';
import {
  LuArrowUpDown,
  LuSettings,
  LuChevronDown,
  LuChevronUp,
  LuArrowRight, LuInfo,
} from 'react-icons/lu';
import { useState } from 'react';
import {TokenLogo} from "@/components/ui/token_logo";

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  image: string;
}

interface Route {
  type: 'LP' | 'OrderBook';
  percentage: number;
  amount: string;
  pools?: string[];
}

const mockAssets: Asset[] = [
  { symbol: 'BZE', name: 'BeeZee', balance: '1,234.56', price: 0.25, image: '/images/bze_alternative_512x512.png' },
  { symbol: 'USDT', name: 'Tether USD', balance: '10,000.00', price: 1.0, image: '/images/bze_alternative_512x512.png' },
  { symbol: 'ETH', name: 'Ethereum', balance: '5.678', price: 2500.0, image: '/images/bze_alternative_512x512.png' },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.123', price: 45000.0, image: '/images/bze_alternative_512x512.png' },
];

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

export default function SwapPage() {
  const [fromAsset, setFromAsset] = useState<Asset>(mockAssets[0]);
  const [toAsset, setToAsset] = useState<Asset>(mockAssets[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [slippage, setSlippage] = useState(2);
  const [customSlippage, setCustomSlippage] = useState('');
  const [useOrderBook, setUseOrderBook] = useState(true);
  const [estimatedOutput] = useState('985.43');
  const [priceImpact] = useState('0.15');
  const [fromSearchTerm, setFromSearchTerm] = useState('');
  const [toSearchTerm, setToSearchTerm] = useState('');
  const [fromSelectOpen, setFromSelectOpen] = useState(false);
  const [toSelectOpen, setToSelectOpen] = useState(false);

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

  const calculateUSDValue = (amount: string, asset: Asset) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;
    return (numAmount * asset.price).toFixed(2);
  };

  const filterAssets = (searchTerm: string) => {
    if (!searchTerm) return mockAssets.slice(0, 10); // Show only first 10 by default
    return mockAssets.filter(asset =>
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20); // Limit filtered results to 20
  };

  const AssetSelector = ({
                           asset,
                           onSelect,
                           placeholder,
                           searchTerm,
                           setSearchTerm,
                           isOpen,
                           setIsOpen,
                         }: {
    asset: Asset;
    onSelect: (asset: Asset) => void;
    placeholder: string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  }) => {
    const filteredAssets = filterAssets(searchTerm);
    const collection = createListCollection({
      items: filteredAssets.map(a => ({
        label: a.symbol,
        value: a.symbol
      }))
    });

    return (
        <Select.Root
            collection={collection}
            value={[asset.symbol]}
            open={isOpen}
            onOpenChange={(details) => {
              setIsOpen(details.open);
              if (!details.open) {
                setSearchTerm('');
              }
            }}
            onValueChange={(details) => {
              const selectedSymbol = details.value[0];
              const selectedAsset = mockAssets.find(a => a.symbol === selectedSymbol);
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
                        src={asset.image}
                        symbol={asset.symbol}
                        size="8"
                        circular={true}
                    />
                    <VStack align="start" gap="1">
                      <HStack gap="2">
                        <Text fontWeight="bold" fontSize="lg">
                          {asset.symbol}
                        </Text>
                        <Text fontSize="md" color="fg.muted">
                          {asset.name}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="fg.muted">
                        Balance: {asset.balance}
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
                            key={assetOption.symbol}
                            item={assetOption.symbol}
                            cursor="pointer"
                            _hover={{ bg: "bg.muted" }}
                        >
                          <Select.ItemText>
                            <HStack gap="3" py="2">
                              <TokenLogo
                                  src={assetOption.image}
                                  symbol={assetOption.symbol}
                                  size="8"
                                  circular={true}
                              />
                              <VStack align="start" gap="0" flex="1">
                                <HStack justify="space-between" w="full">
                                  <Text fontWeight="medium" fontSize="md">
                                    {assetOption.symbol}
                                  </Text>
                                  <Text fontSize="sm" color="fg.muted">
                                    Balance: {assetOption.balance}
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" color="fg.muted">
                                  {assetOption.name}
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
              {!searchTerm && mockAssets.length > 10 && (
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
            Amount: {route.amount} {toAsset.symbol}
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
                      searchTerm={fromSearchTerm}
                      setSearchTerm={setFromSearchTerm}
                      isOpen={fromSelectOpen}
                      setIsOpen={setFromSelectOpen}
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
                      searchTerm={toSearchTerm}
                      setSearchTerm={setToSearchTerm}
                      isOpen={toSelectOpen}
                      setIsOpen={setToSelectOpen}
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
                            {estimatedOutput} {toAsset.symbol}
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