import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["@chakra-ui/react", "@bze/bze-ui-kit"]
    },
    transpilePackages: ["@bze/bze-ui-kit"],
};

export default nextConfig;
