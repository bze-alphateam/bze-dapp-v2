import type { NextConfig } from "next";

// Wagmi's `wagmi/connectors` barrel re-exports every connector (metaMask, porto, safe,
// coinbase, baseAccount, walletConnect, injected). We only use `injected` and
// `walletConnect`. The unused connector SDKs — plus solana code paths reached
// transitively via @base-org/account → @coinbase/cdp-sdk — would otherwise cause
// "module not found" errors. Alias them to an empty stub so the bundler skips them.
const UNUSED_DEPS = [
    '@metamask/connect-evm',
    'porto',
    'porto/internal',
    '@safe-global/safe-apps-sdk',
    '@safe-global/safe-apps-provider',
    '@coinbase/wallet-sdk',
    '@solana/kit',
];

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["@chakra-ui/react", "@bze/bze-ui-kit"]
    },
    transpilePackages: ["@bze/bze-ui-kit"],
    turbopack: {
        resolveAlias: Object.fromEntries(
            UNUSED_DEPS.map((dep) => [dep, './stubs/empty.js'])
        ),
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            ...Object.fromEntries(UNUSED_DEPS.map((dep) => [dep, false])),
        };
        return config;
    },
};

export default nextConfig;
