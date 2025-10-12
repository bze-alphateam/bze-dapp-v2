import {getChainNativeAssetDenom} from "@/constants/assets";

export const BZE_TESTNET_2_SUGGEST_CHAIN = {
    chainId: "bzetestnet-2",
    chainType: "cosmos",
    chainName: "BeeZee Testnet",
    prettyName: 'BeeZee Testnet',
    networkType: 'mainnet',
    bech32Prefix: "testbz",
    status: "live",
    slip44: 118,
    logoURIs: {
        svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg',
    },
    fees: {
        feeTokens: [
            {
                denom: getChainNativeAssetDenom(),
                fixedMinGasPrice: 0.01,
                lowGasPrice: 0.01,
                averageGasPrice: 0.025,
                highGasPrice: 0.04
            }
        ]
    },
    keyAlgos: [
        "secp256k1"
    ],
    staking: {
        stakingTokens: [
            {
                denom: getChainNativeAssetDenom()
            }
        ]
    },
    explorers: [
        {
            "kind": "ping.pub",
            "url": "https://testnet.explorer.thesilverfox.pro/beezee",
            "tx_page": "https://testnet.explorer.thesilverfox.pro/beezee/tx/${txHash}"
        }
    ],
    codebase: {
        "git_repo": "https://github.com/bze-alphateam/bze",
        "recommended_version": "v5.1.2",
        "compatible_versions": [
            "v5.1.2"
        ],
        "binaries": {
            "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-amd64.tar.gz",
            "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-arm64.tar.gz",
            "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-amd64.tar.gz",
            "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-arm64.tar.gz",
            "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-win64.zip"
        },
        "genesis": {
            "genesis_url": "https://raw.githubusercontent.com/bze-alphateam/bze/main/genesis.json"
        }
    },
    apis: {
        "rpc": [
            {
                "address": "https://testnet-rpc.getbze.com",
                "provider": "AlphaTeam"
            }
        ],
        "rest": [
            {
                "address": "https://testnet.getbze.com",
                "provider": "AlphaTeam"
            },
        ],
        "grpc": [
            {
                "address": "grpc.getbze.com:9999",
                "provider": "AlphaTeam"
            }
        ]
    }
};

export const BZE_TESTNET_NETWORK = {
    base: {
        explorerBaseUrl: 'https://explorer.getbze.com/bze%20testnet',
        rpcUrl: 'https://testnet-rpc.getbze.com',
        restUrl: 'https://testnet.getbze.com',
        chainName: BZE_TESTNET_2_SUGGEST_CHAIN.chainName,
    },
    chain: [BZE_TESTNET_2_SUGGEST_CHAIN],
    assets: [
        {
            chainName: BZE_TESTNET_2_SUGGEST_CHAIN.chainName,
            assets: [
                {
                    "description": "BeeZee native blockchain",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": getChainNativeAssetDenom(),
                            "exponent": 0
                        },
                        {
                            "denom": "TBZE",
                            "exponent": 6
                        }
                    ],
                    "base": getChainNativeAssetDenom(),
                    "name": "BeeZee",
                    "display": "TBZE",
                    "symbol": "TBZE",
                    "logoURIs": {
                        "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
                        "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png"
                    },
                    "coingeckoId": "bzedge"
                },
                {
                    "description": "BitcoinZ wrapped on BZE network",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/bitcoinz",
                            "exponent": 0
                        },
                        {
                            "denom": "BTCZ",
                            "exponent": 8
                        }
                    ],
                    "base": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/bitcoinz",
                    "name": "BitcoinZ",
                    "display": "BTCZ",
                    "symbol": "BTCZ",
                    "logoURIs": {
                        "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
                        "png": "https://getbtcz.com/wp-content/uploads/2020/05/BTCZ-LOGO-fresh.png"
                    },
                    "coingeckoId": "bitcoinz"
                },
                {
                    "description": "A test denomination created by Faneatiku",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku1",
                            "exponent": 0,
                            "aliases": []
                        },
                        {
                            "denom": "ALPHA",
                            "exponent": 6,
                            "aliases": []
                        }
                    ],
                    "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku1",
                    "display": "ALPHA",
                    "name": "Alpha",
                    "symbol": "ALP"
                },
                {
                    "description": "A test denomination created by Faneatiku",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku2",
                            "exponent": 0,
                            "aliases": []
                        },
                        {
                            "denom": "BETA",
                            "exponent": 6,
                            "aliases": []
                        }
                    ],
                    "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku2",
                    "display": "BETA",
                    "name": "Beta",
                    "symbol": "BETA"
                },
                {
                    "description": "Stefan's token",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku3",
                            "exponent": 0,
                            "aliases": []
                        }
                    ],
                    "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku3",
                    "display": "STF",
                    "name": "STeF",
                    "symbol": "STF"
                },
                {
                    "description": "Celestia",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "ibc/2537300C916FD9DFBE5995327C56667963FD29A2272A4EC6A90C01D753F4FCFE",
                            "exponent": 0,
                            "aliases": []
                        },
                        {
                            "denom": "TIA",
                            "exponent": 6,
                            "aliases": []
                        },
                    ],
                    "base": "ibc/2537300C916FD9DFBE5995327C56667963FD29A2272A4EC6A90C01D753F4FCFE",
                    "display": "TIA",
                    "name": "Celestia",
                    "symbol": "TIA",
                    "logoURIs": {
                        "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/celestia/images/celestia.png"
                    }
                },
                {
                    "description": "Vidulum token",
                    "typeAsset": "sdk.coin",
                    "denomUnits": [
                        {
                            "denom": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum",
                            "exponent": 0,
                            "aliases": []
                        },
                        {
                            "denom": "TVDL",
                            "exponent": 6,
                            "aliases": []
                        },
                    ],
                    "base": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum",
                    "display": "TVDL",
                    "name": "Vidulum",
                    "symbol": "TVDL",
                    "logoURIs": {
                        "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/vidulum/images/vdl.png"
                    },
                },
            ]
        }
    ]
}
