import {getAllSupply, getAllSupplyMetadata} from "@/query/supply";
import {MetadataSDKType} from "@bze/bzejs/cosmos/bank/v1beta1/bank";
import {Asset} from "@/types/asset";
import {getDenomType, isFactoryDenom, isIbcDenom, isLpDenom, isNativeDenom, truncateDenom} from "@/utils/denom";
import {BZE_CIRCLE_LOGO, TOKEN_LOGO_PLACEHOLDER} from "@/constants/placeholders";
import {EXCLUDED_ASSETS, STABLE_COINS, VERIFIED_ASSETS} from "@/constants/assets";
import {getAssetLists, getChainName, getIBCAssetList} from "@/constants/chain";
import {getExponentByDenomFromAsset} from "@chain-registry/utils";


// returns all assets from the chain except LP tokens
export const getChainAssets = async (): Promise<Asset[]> => {
    const [metadata, supply] = await Promise.all([getAllMetadataMap(), getAllSupply()])
    if (!metadata || !supply) {
        return [];
    }

    return supply
        .filter(asset => !isLpDenom(asset.denom) && !EXCLUDED_ASSETS[asset.denom]) //filter out LP tokens & excluded assets
        .map(asset => {
            //create base asset
            const baseAsset = createAsset(asset.denom, BigInt(asset.amount));
            //try to populate asset from chain registry
            let finalAsset = populateAssetFromChainRegistry(baseAsset);

            if (!finalAsset) {
                //we could not populate asset from chain registry, try to populate from blockchain metadata
                const metadataEntry = metadata[asset.denom]
                finalAsset = populateAssetFromBlockchainMetadata(baseAsset, metadataEntry)
            }

            return finalAsset;
    })
}

const populateAssetFromChainRegistry = (asset: Asset): Asset|undefined => {
    if (isIbcDenom(asset.denom)) {
        const ibcList = getIBCAssetList()
        const ibcData = ibcList.find((item) => item.base === asset.denom)

        if (ibcData) {
            asset.name = ibcData.name
            asset.ticker = ibcData.symbol.toUpperCase()
            asset.decimals = getExponentByDenomFromAsset(ibcData, asset.denom) ?? 0
            asset.logo = ibcData.logoURIs?.svg ?? ibcData.logoURIs?.png ?? TOKEN_LOGO_PLACEHOLDER
            asset.verified = true
        }

        return asset
    }

    const data = getAssetLists().find((item) => item.chainName.toLowerCase() === getChainName().toLowerCase())
    if (!data) {
        return undefined;
    }

    const assetData = data.assets.find(item => item.base === asset.denom)
    if (!assetData) {
        return undefined;
    }

    if (isNativeDenom(asset.denom) || isFactoryDenom(asset.denom)) {
        asset.decimals = getExponentByDenomFromAsset(assetData, asset.denom) ?? 0
        asset.name = assetData.name
        asset.ticker = assetData.display.toUpperCase()
        asset.logo = isNativeDenom(asset.denom) ? BZE_CIRCLE_LOGO : assetData.logoURIs?.svg ?? assetData.logoURIs?.png ?? TOKEN_LOGO_PLACEHOLDER

        return asset
    }

    return undefined
}

const populateAssetFromBlockchainMetadata = (asset: Asset,  meta: MetadataSDKType|undefined): Asset => {
    if (!meta || meta.base !== asset.denom) {
        return asset;
    }

    if (meta.name.length > 0) {
        asset.name = meta.name
    }
    if (meta.symbol.length > 0) {
        asset.ticker = meta.symbol.toUpperCase()
    }

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

const createAsset = (denom: string, supply: bigint): Asset => {
    return {
        denom: denom,
        type: getDenomType(denom),
        name: truncateDenom(denom),
        ticker: truncateDenom(denom),
        decimals: 6,
        logo: TOKEN_LOGO_PLACEHOLDER,
        stable: STABLE_COINS[denom] ?? false,
        verified: VERIFIED_ASSETS[denom] ?? false,
        supply: supply,
    }
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
