import { chains, assetLists } from "chain-registry/mainnet";
import { chains as testnetChains } from "chain-registry/testnet";
import { ibcData } from 'chain-registry';
import {getAssetLists as ibcAssetsList} from "@chain-registry/utils";
import {BZE_TESTNET_2_SUGGEST_CHAIN, BZE_TESTNET_NETWORK} from "@/constants/testnet";
import {Chain} from "@chain-registry/types";

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
        //@ts-expect-error - testnet chains are not in the chain-registry package
        localChains = [...testnetChains, BZE_TESTNET_2_SUGGEST_CHAIN]
    }

    const envChainsNames = process.env.NEXT_PUBLIC_WALLET_CHAINS_NAMES
    if (!envChainsNames) {
        return localChains.filter(c => c.chainId === getChainId())
    }

    const split = envChainsNames.split(',')

    return appChainFirst(localChains.filter(c => split.includes(c.chainName)))
}

const appChainFirst = (chains: Chain[]) => {
    return chains.sort((a, b) => a.chainId === getChainId() ? -1 : b.chainId === getChainId() ? 1 : 0)
}

export const getAssetLists = () => {
    let localAssetLists = assetLists
    if (isTestnetChain()) {
        //@ts-expect-error - testnet asset lists are not in the chain-registry package
        localAssetLists = BZE_TESTNET_NETWORK.assets
    }

    return localAssetLists
}

export const getIBCAssetList = () => {
    //TODO: find a better way to get the ibc assets list
    // this is logging an error (from chain-registry utils package) when an asset has more than 1 trace
    // it works but we don't like the error :)
    const all = ibcAssetsList(getChainName(), ibcData, getAssetLists())

    return all.length > 0 ? all[0].assets : []
}

export const getChainAddressPrefix = () => {
    return process.env.NEXT_PUBLIC_CHAIN_ADDRESS_PREFIX || 'bze'
}

export const getChainExplorerURL = (chainName: string): string => {
    if (process.env.NEXT_PUBLIC_EXPLORER_URL) {
        return `${process.env.NEXT_PUBLIC_EXPLORER_URL}/${chainName}`
    }

    return `https://explorer.chaintools.tech/${chainName}`
}
