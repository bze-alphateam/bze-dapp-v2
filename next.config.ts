import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["@chakra-ui/react", "@bze/bze-ui-kit"]
    },
    transpilePackages: ["@bze/bze-ui-kit"],
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "ALLOWALL" },
                ],
            },
        ];
    },
};

export default nextConfig;
