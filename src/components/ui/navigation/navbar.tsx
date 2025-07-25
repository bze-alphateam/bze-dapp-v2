'use client';

import {Box, Container, HStack, Spacer, Button, Image, ClientOnly, Skeleton, Text} from '@chakra-ui/react'
import { MobilePopover } from './mobile-popover'
import { NavbarLinks } from './navbar-links'
import {useColorModeValue} from "@/components/ui/color-mode";
import {LuWallet} from "react-icons/lu";
import {SettingsToggle} from "@/components/ui/settings";
import {Sidebar} from "@/components/ui/sidebar/sidebar";
import {WalletSidebarContent} from "@/components/ui/sidebar/wallet-sidebar";
import {MobileNavbarLinks} from "@/components/ui/navigation/mobile-navbar-links";

interface TopNavBarProps {
    appLabel?: string;
}

export const TopNavBar = ({ appLabel = "DEX" }: TopNavBarProps) => {
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
                        <Sidebar
                            ariaLabel="Wallet"
                            trigger={
                                <Button size={{ base: 'sm', md: 'md' }}>
                                    <LuWallet /> Wallet
                                </Button>
                            }
                        >
                            <WalletSidebarContent />
                        </Sidebar>
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