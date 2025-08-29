'use client';

import {Box, Button, ClientOnly, Container, HStack, Image, Skeleton, Spacer, Text} from '@chakra-ui/react'
import {NavbarLinks} from './navbar-links'
import {useColorModeValue} from "@/components/ui/color-mode";
import {LuWallet} from "react-icons/lu";
import {SettingsToggle} from "@/components/ui/settings";
import {Sidebar} from "@/components/ui/sidebar/sidebar";
import {WalletSidebarContent} from "@/components/ui/sidebar/wallet-sidebar";
import {MobileNavbarLinks} from "@/components/ui/navigation/mobile-navbar-links";
import {useAssets} from "@/hooks/useAssets";
import {useBalance} from "@/hooks/useBalances";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {WalletState} from "@interchain-kit/core";
import {useMemo} from "react";
import {shortNumberFormat} from "@/utils/formatter";
import {uAmountToBigNumberAmount} from "@/utils/amount";
import {getChainNativeAssetDenom} from "@/constants/assets";

interface TopNavBarProps {
    appLabel?: string;
}

export const TopNavBar = ({ appLabel = "DEX" }: TopNavBarProps) => {
    const {nativeAsset} = useAssets()
    const {balance} = useBalance(getChainNativeAssetDenom())
    const {status} = useChain(getChainName());

    const walletButtonText = useMemo(() => {
        if (status !== WalletState.Connected || !nativeAsset) {
            return "";
        }

        const humanBalance = uAmountToBigNumberAmount(balance.amount, nativeAsset.decimals)

        return `${shortNumberFormat(humanBalance)} ${nativeAsset.ticker}`
    }, [status, nativeAsset, balance])

    return (
        <Box borderBottomWidth="1px" bg="bg.panel">
            <Container py={{ base: '3.5', md: '4' }}>
                <HStack justify="space-between">
                    <HStack gap="2" align="center">
                        <ClientOnly fallback={<Image height="28px" src="/images/beezee_light.svg"  alt="BZE application logo"/>}>
                            <Image
                                height={{base: "22px", md: "28px"}}
                                src={useColorModeValue("/images/beezee_dark.svg", "/images/beezee_light.svg")}
                                alt="BZE application logo"
                            />
                        </ClientOnly>
                        <Text
                            fontSize={{ base: "sm", md: "md" }}
                            fontWeight="extrabold"
                            color="#10a6d8"
                            letterSpacing="tighter"
                            textTransform="uppercase"
                            opacity="0.8"
                            transition="all 1s ease"
                        >
                            {appLabel}
                        </Text>
                    </HStack>
                    <Spacer hideFrom="md" />
                    <NavbarLinks hideBelow="md" />
                    <Box display={"flex"} gap={{ base: 1, md: 4}}>
                        {/* Wallet Sidebar */}
                        <ClientOnly fallback={<Skeleton  w="10" h="10" rounded="md" />}>
                            <Sidebar
                                ariaLabel="Wallet"
                                trigger={
                                    <Button size={{ base: 'sm', md: 'md' }}>
                                        <LuWallet /> {walletButtonText}
                                    </Button>
                                }
                            >
                                <WalletSidebarContent />
                            </Sidebar>
                        </ClientOnly>
                        <ClientOnly fallback={<Skeleton  w="10" h="10" rounded="md" />}>
                            <SettingsToggle />
                        </ClientOnly>
                    </Box>
                    <MobileNavbarLinks />
                </HStack>
            </Container>
        </Box>
    )
}