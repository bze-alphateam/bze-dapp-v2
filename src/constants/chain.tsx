import { chains, assetLists } from "chain-registry/mainnet";
import { chains as testnetChains, assetLists as testnetAssetLists } from "chain-registry/testnet";
import { ibcData } from 'chain-registry';
import {getAssetLists as ibcAssetsList} from "@chain-registry/utils";

export const getChainId = (): string => {
    return process.env.NEXT_PUBLIC_CHAIN_ID || 'beezee-1'
}

export const getChainName = (): string => {
    return process.env.NEXT_PUBLIC_CHAIN_NAME || 'beezee'
}

export const isTestnetChain = (): boolean => {
    const isTestnet = process.env.NEXT_PUBLIC_CHAIN_IS_TESTNET
    return isTestnet === 'true' || isTestnet === '1'
}

export const getWalletChainsNames = () => {
    let localChains = chains
    if (isTestnetChain()) {
        localChains = testnetChains
    }

    const envChainsNames = process.env.NEXT_PUBLIC_WALLET_CHAINS_NAMES
    if (!envChainsNames) {
        return localChains.filter(c => c.chainId === getChainId())
    }

    const split = envChainsNames.split(',')

    return localChains.filter(c => split.includes(c.chainName.toLowerCase()))
}

export const getAssetLists = () => {
    let localAssetLists = assetLists
    if (isTestnetChain()) {
        localAssetLists = testnetAssetLists
    }

    return localAssetLists
}

export const getIBCAssetList = () => {
    const all = ibcAssetsList(getChainName(), ibcData, getAssetLists())

    return all.length > 0 ? all[0].assets : []
}
