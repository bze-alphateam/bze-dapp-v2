'use client';

import { useBlockchainListener } from '@/hooks/useBlockchainListener';

export function BlockchainListenerWrapper() {
    useBlockchainListener();
    return null; // This component renders nothing, just runs the hook
}