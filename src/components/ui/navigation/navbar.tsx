'use client';

import {Box, Container, HStack, Spacer, Button, Image, ClientOnly, Skeleton} from '@chakra-ui/react'
import { MobilePopover } from './mobile-popover'
import { NavbarLinks } from './navbar-links'
import {useColorModeValue} from "@/components/ui/color-mode";
import {LuWallet} from "react-icons/lu";
import {SettingsToggle} from "@/components/ui/settings";
import { Sidebar } from "@/components/ui/sidebar/sidebar";
import { WalletSidebarContent } from "@/components/ui/sidebar/wallet-sidebar";

export const TopNavBar = () => {
    return (
        <Box borderBottomWidth="1px" bg="bg.panel">
            <Container py={{ base: '3.5', md: '4' }}>
                <HStack justify="space-between">
                    <ClientOnly fallback={<Image height="28px" src="/images/beezee_light.svg"  alt="BZE application logo"/>}>
                        <Image
                            height="28px"
                            src={useColorModeValue("/images/beezee_dark.svg", "/images/beezee_light.svg")}
                            alt="BZE application logo"
                        />
                    </ClientOnly>
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

                        {/* Settings Sidebar */}
                        <ClientOnly fallback={<Skeleton  w="10" h="10" rounded="md" />}>
                            <SettingsToggle />
                        </ClientOnly>
                    </Box>
                    <MobilePopover>
                        <NavbarLinks />
                    </MobilePopover>
                </HStack>
            </Container>
        </Box>
    )
}