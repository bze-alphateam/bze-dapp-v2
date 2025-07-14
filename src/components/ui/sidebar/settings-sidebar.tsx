'use client'

import {
    VStack,
    HStack,
    Text,
    Switch,
    Button,
    Separator,
    Select,
    Box,
    createListCollection
} from '@chakra-ui/react'
import { useTheme } from "next-themes"
import { useState } from 'react'

export const SettingsSidebarContent = () => {
    const { theme, setTheme } = useTheme()
    const [notifications, setNotifications] = useState(true)
    const [autoSave, setAutoSave] = useState(false)
    const [language, setLanguage] = useState('en')

    // Create collection for language select
    const languageCollection = createListCollection({
        items: [
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" },
            { label: "German", value: "de" },
            { label: "Romanian", value: "ro" },
        ],
    })

    const handleSave = () => {
        // Here you would save the settings to your backend/storage
        console.log('Settings saved:', {
            theme,
            notifications,
            autoSave,
            language
        })
        // You could show a toast notification here
    }

    const handleReset = () => {
        setTheme('light')
        setNotifications(true)
        setAutoSave(false)
        setLanguage('en')
    }

    return (
        <VStack gap="6" align="stretch" height="100%">
            {/* Theme Setting */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Appearance
                </Text>
                <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="sm">Dark Mode</Text>
                        <Switch.Root
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) =>
                                setTheme(checked ? 'dark' : 'light')
                            }
                        >
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Root>
                    </HStack>
                </VStack>
            </Box>

            <Separator />

            {/* Notifications */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Notifications
                </Text>
                <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="sm">Enable Notifications</Text>
                        <Switch.Root
                            checked={notifications}
                            onCheckedChange={(details) => setNotifications(details.checked)}
                        >
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Root>
                    </HStack>
                </VStack>
            </Box>

            <Separator />

            {/* Preferences */}
            <Box>
                <Text fontSize="sm" fontWeight="medium" mb="3">
                    Preferences
                </Text>
                <VStack gap="3" align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="sm">Auto-save</Text>
                        <Switch.Root
                            checked={autoSave}
                            onCheckedChange={(details) => setAutoSave(details.checked)}
                        >
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Root>
                    </HStack>

                    <Box>
                        <Text fontSize="sm" mb="2">Language</Text>
                        <Select.Root
                            collection={languageCollection}
                            size="sm"
                            value={[language]}
                            onValueChange={(details) => setLanguage(details.value[0])}
                        >
                            <Select.Trigger>
                                <Select.ValueText placeholder="Select language" />
                            </Select.Trigger>
                            <Select.Content>
                                {languageCollection.items.map((item) => (
                                    <Select.Item key={item.value} item={item}>
                                        {item.label}
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                </VStack>
            </Box>

            {/* Action Buttons */}
            <Box mt="auto" pt="4">
                <VStack gap="3">
                    <Button
                        size="sm"
                        width="full"
                        onClick={handleSave}
                        colorPalette="blue"
                    >
                        Save Settings
                    </Button>
                    <Button
                        size="sm"
                        width="full"
                        variant="outline"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </Button>
                </VStack>
            </Box>
        </VStack>
    )
}