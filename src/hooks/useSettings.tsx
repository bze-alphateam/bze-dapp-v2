'use client'

import { useState, useEffect } from 'react'
import { AppSettings, BeeZeeEndpoints } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/constants/settings'
import {getSettings, setSettings} from "@/storage/settings";

// Custom hook for managing application settings
export function useSettings() {
    const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        setSettingsState(getSettings())
        setIsLoaded(true)
    }, [])

    // Save settings to localStorage
    const saveSettings = (newSettings: AppSettings): boolean => {
        setSettings(newSettings)
        setSettingsState(newSettings)
        return true
    }

    // Update endpoint configuration
    const updateEndpoints = (endpoints: BeeZeeEndpoints): boolean => {
        const newSettings = { ...settings, endpoints }
        return saveSettings(newSettings)
    }

    // Reset all settings to default values
    const resetToDefaults = (): boolean => {
        saveSettings(DEFAULT_SETTINGS)
        return true
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