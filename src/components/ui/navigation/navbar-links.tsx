import { Link, Stack, type StackProps, Menu, Text, Portal, Box } from '@chakra-ui/react'
import NextLink from 'next/link'
import {useNavigation} from "@/hooks/useNavigation";

interface NavbarLinksProps extends StackProps {
    onLinkClick?: () => void
}

// Define your navigation items with their routes
const navItems = [
    { name: 'Swap', href: '/' },
    { name: 'Exchange', href: '/exchange' },
    { name: 'Staking', href: '/staking' },
    { name: 'Pools', href: '/pools' },
    { name: 'Assets', href: '/assets' },
]

// Apps dropdown items
const appsItems = [
    { name: '🌐 Website', href: 'https://getbze.com', disabled: false },
    { name: '🔥 Burner', href: 'https://burner.getbze.com', disabled: false },
    { name: '🔧 Factory', href: '#', disabled: true },
]

const navSubitems: { [key: string]: string } = {
    "/exchange/market": "/exchange",
    "/pools/details": "/pools",
}

export const NavbarLinks = ({ onLinkClick, ...props }: NavbarLinksProps) => {
    const {navigate, currentPathName} = useNavigation()

    const handleClick = (path: string) => {
        navigate(path)
        if (onLinkClick) onLinkClick()
    }

    return (
        <Stack direction={{ base: 'column', md: 'row' }} gap={{ base: '6', md: '8' }} {...props}>
            {navItems.map((item) => {
                const isActive = currentPathName === item.href || item.href === navSubitems[currentPathName]

                return (
                    <Link
                        onClick={() => handleClick(item.href)}
                        key={item.name}
                        as={NextLink}
                        href={item.href}
                        fontWeight="medium"
                        color={isActive ? 'colorPalette.fg' : 'fg.muted'}
                        textDecoration="none"
                        transition="color 0.2s"
                        _hover={{
                            color: 'colorPalette.fg',
                            textDecoration: 'none',
                        }}
                        _focus={{
                            outline: 'none',
                            boxShadow: 'none',
                        }}
                        _focusVisible={{
                            outline: '2px solid',
                            outlineColor: 'colorPalette.500',
                            outlineOffset: '2px',
                        }}
                    >
                        {item.name}
                    </Link>
                )
            })}

            {/* Other Items - Mobile: Inline, Desktop: Dropdown */}

            {/* Mobile: Show items inline */}
            <Box hideFrom="md">
                <Text
                    fontWeight="medium"
                    color="fg.muted"
                    fontSize="sm"
                    mb="3"
                >
                    Other
                </Text>
                <Stack direction="column" gap="4" pl="4">
                    {appsItems.map((item) => (
                        item.disabled ? (
                            <Text
                                key={item.name}
                                fontWeight="medium"
                                color="fg.muted"
                                opacity={0.5}
                            >
                                {item.name} <Text as="span" fontSize="xs">(coming soon)</Text>
                            </Text>
                        ) : (
                            <Link
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                fontWeight="medium"
                                color="fg.muted"
                                textDecoration="none"
                                transition="color 0.2s"
                                onClick={onLinkClick}
                                _hover={{
                                    color: 'colorPalette.fg',
                                    textDecoration: 'none',
                                }}
                            >
                                {item.name}
                            </Link>
                        )
                    ))}
                </Stack>
            </Box>

            {/* Desktop: Show as dropdown menu */}
            <Box hideBelow="md">
                <Menu.Root>
                    <Menu.Trigger asChild>
                        <Text
                            as="button"
                            fontWeight="medium"
                            color="fg.muted"
                            cursor="pointer"
                            transition="color 0.2s"
                            _hover={{
                                color: 'colorPalette.fg',
                            }}
                            _focus={{
                                outline: 'none',
                                boxShadow: 'none',
                            }}
                        >
                            Other
                        </Text>
                    </Menu.Trigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content>
                                {appsItems.map((item) => (
                                    <Menu.Item
                                        key={item.name}
                                        value={item.name}
                                        disabled={item.disabled}
                                        asChild={!item.disabled}
                                    >
                                        {item.disabled ? (
                                            <Text>
                                                {item.name} <Text as="span" fontSize="xs" color="fg.muted">(coming soon)</Text>
                                            </Text>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                textDecoration="none"
                                                color="inherit"
                                                display="block"
                                                width="100%"
                                                onClick={onLinkClick}
                                            >
                                                {item.name}
                                            </Link>
                                        )}
                                    </Menu.Item>
                                ))}
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu.Root>
            </Box>
        </Stack>
    )
}
