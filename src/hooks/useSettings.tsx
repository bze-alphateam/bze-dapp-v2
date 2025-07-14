'use client'

import { useState, useEffect } from 'react'
import { AppSettings, BeeZeeEndpoints } from '@/types/settings'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/constants/settings'

// Custom hook for managing application settings
export function useSettings() {
    const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Merge with defaults to ensure all required properties exist
                setSettingsState({ ...DEFAULT_SETTINGS, ...parsed })
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error)
        } finally {
            setIsLoaded(true)
        }
    }, [])

    // Save settings to localStorage
    const saveSettings = (newSettings: AppSettings): boolean => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
            setSettingsState(newSettings)
            return true
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error)
            return false
        }
    }

    // Update endpoint configuration
    const updateEndpoints = (endpoints: BeeZeeEndpoints): boolean => {
        const newSettings = { ...settings, endpoints }
        return saveSettings(newSettings)
    }

    // Reset all settings to default values
    const resetToDefaults = (): boolean => {
        try {
            localStorage.removeItem(SETTINGS_STORAGE_KEY)
            setSettingsState(DEFAULT_SETTINGS)
            return true
        } catch (error) {
            console.error('Failed to reset settings:', error)
            return false
        }
    }

    // Get current endpoint configuration
    const getEndpoints = (): BeeZeeEndpoints => {
        return settings.endpoints
    }

    return {
        settings,
        isLoaded,
        saveSettings,
        updateEndpoints,
        resetToDefaults,
        getEndpoints
    }
}