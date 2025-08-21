import {getAllSupply, getAllSupplyMetadata} from "@/query/supply";
import {MetadataSDKType} from "@bze/bzejs/cosmos/bank/v1beta1/bank";
import {Asset} from "@/types/asset";
import {getDenomType, isLpDenom, truncateDenom} from "@/utils/denom";
import {TOKEN_LOGO_PLACEHOLDER} from "@/constants/placeholders";
import {STABLE_COINS, VERIFIED_ASSETS} from "@/constants/assets";

// returns all assets from the chain except LP tokens
export const getChainAssets = async (): Promise<Asset[]> => {
    const [metadata, supply] = await Promise.all([getAllMetadataMap(), getAllSupply()])
    if (!metadata || !supply) {
        return [];
    }

    return supply
        .filter(asset => !isLpDenom(asset.denom)) //filter out LP tokens
        .map(asset => {
        const metadataEntry = metadata[asset.denom]

        return createAsset(asset.denom, metadataEntry)
    })
}

const createAsset = (denom: string, meta: MetadataSDKType|undefined): Asset => {
    const asset: Asset = {
        denom: denom,
        type: getDenomType(denom),
        name: truncateDenom(denom),
        ticker: truncateDenom(denom),
        decimals: 6,
        logo: TOKEN_LOGO_PLACEHOLDER,
        stable: false,
        verified: false
    }

    if (!meta || meta.base !== denom) {
        return asset;
    }

    asset.name = meta.name
    asset.ticker = meta.symbol.toUpperCase()
    //TODO: add logo & override other values from CR
    asset.stable = STABLE_COINS[denom] ?? false
    asset.verified = VERIFIED_ASSETS[denom] ?? false

    if (meta.denom_units.length === 0) {
        return asset;
    }

    meta.denom_units.map(unit => {
        if (unit.denom === meta.display) {
            asset.decimals = unit.exponent
            asset.ticker = unit.denom.toUpperCase()
        }
    })

    return asset;
}

const getAllMetadataMap = async () => {
    const allMetadata = await getAllSupplyMetadata()
    if (!allMetadata) {
        return {};
    }

    return allMetadata.reduce<Record<string, MetadataSDKType>>((acc, asset: MetadataSDKType) => {
        acc[asset.base] = asset;

        return acc;
    }, {});
}
