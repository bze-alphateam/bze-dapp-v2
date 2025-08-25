import {getAllSupply, getAllSupplyMetadata} from "@/query/supply";
import {MetadataSDKType} from "@bze/bzejs/cosmos/bank/v1beta1/bank";
import {Asset} from "@/types/asset";
import {getDenomType, isIbcDenom, isLpDenom, truncateDenom} from "@/utils/denom";
import {TOKEN_LOGO_PLACEHOLDER} from "@/constants/placeholders";
import {EXCLUDED_ASSETS, STABLE_COINS, VERIFIED_ASSETS} from "@/constants/assets";
import {getIBCAssetList} from "@/constants/chain";
import {getExponentByDenomFromAsset} from "@chain-registry/utils";


// returns all assets from the chain except LP tokens
export const getChainAssets = async (): Promise<Asset[]> => {
    const [metadata, supply] = await Promise.all([getAllMetadataMap(), getAllSupply()])
    if (!metadata || !supply) {
        return [];
    }

    return supply
        .filter(asset => !isLpDenom(asset.denom) || !EXCLUDED_ASSETS[asset.denom]) //filter out LP tokens & excluded assets
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

    if (isIbcDenom(asset.denom)) {
        const ibcList = getIBCAssetList()
        const ibcData = ibcList.find((item) => item.base === asset.denom)

        if (ibcData) {
            asset.name = ibcData.name
            asset.ticker = ibcData.symbol
            asset.decimals = getExponentByDenomFromAsset(ibcData, asset.denom) ?? 0
            asset.logo = ibcData.logoURIs?.svg ?? ibcData.logoURIs?.png ?? TOKEN_LOGO_PLACEHOLDER
        }

        return asset
    }

    if (!meta || meta.base !== denom) {
        return asset;
    }

    if (meta.name.length > 0) {
        asset.name = meta.name
    }
    if (meta.symbol.length > 0) {
        asset.ticker = meta.symbol.toUpperCase()
    }

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
