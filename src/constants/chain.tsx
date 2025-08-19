import { chains, assetLists } from "chain-registry";

export const getChainId = (): string => {
    return process.env.NEXT_PUBLIC_CHAIN_ID || 'beezee-1'
}

export const getWalletChainsNames = () => {
    const envChainsNames = process.env.NEXT_PUBLIC_WALLET_CHAINS_NAMES
    if (!envChainsNames) {
        return chains.filter(c => c.chainId === getChainId())
    }

    const split = envChainsNames.split(',')

    return chains.filter(c => split.includes(c.chainName.toLowerCase()))
}

export const getAssetLists = () => {
    return assetLists
}
