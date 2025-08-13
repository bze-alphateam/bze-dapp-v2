
export const getChainId = (): string => {
    return process.env.NEXT_PUBLIC_CHAIN_ID || 'beezee-1'
}
