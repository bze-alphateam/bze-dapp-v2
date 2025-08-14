'use client';

import { useCallback } from 'react';
import { toaster } from '@/components/ui/toaster';

// Custom hook that wraps your existing toaster with a nice API
export const useToast = () => {
    return {
        toast: {
            success: useCallback((title: string, description?: string, duration = 5000) => {
                toaster.create({
                    title,
                    description,
                    type: 'success',
                    duration,
                    closable: true,
                });
            }, []),

            error: useCallback((title: string, description?: string, duration = 8000) => {
                toaster.create({
                    title,
                    description,
                    type: 'error',
                    duration,
                    closable: true,
                });
            }, []),

            warning: useCallback((title: string, description?: string, duration = 6000) => {
                toaster.create({
                    title,
                    description,
                    type: 'warning',
                    duration,
                    closable: true,
                });
            }, []),

            info: useCallback((title: string, description?: string, duration = 5000) => {
                toaster.create({
                    title,
                    description,
                    type: 'info',
                    duration,
                    closable: true,
                });
            }, []),

            loading: useCallback((title: string, description?: string) => {
                return toaster.create({
                    title,
                    description,
                    type: 'loading',
                    closable: false,
                });
            }, []),

            // Method to dismiss a specific toast (useful for loading states)
            dismiss: useCallback((id: string) => {
                toaster.dismiss(id);
            }, []),
        }
    };
};