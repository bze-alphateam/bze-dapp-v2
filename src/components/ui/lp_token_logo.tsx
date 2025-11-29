import React from 'react';
import { Box, BoxProps } from "@chakra-ui/react";
import { TokenLogo } from "./token_logo";

export interface LPTokenLogoProps extends Omit<BoxProps, 'size'> {
    baseAssetLogo: string;
    quoteAssetLogo: string;
    baseAssetSymbol: string;
    quoteAssetSymbol: string;
    size?: string;
}

export const LPTokenLogo = ({
    baseAssetLogo,
    quoteAssetLogo,
    baseAssetSymbol,
    quoteAssetSymbol,
    size = "8",
    ...props
}: LPTokenLogoProps) => {
    return (
        <Box position="relative" display="inline-flex" alignItems="center" {...props}>
            {/* Base asset logo - positioned to the left */}
            <Box
                position="relative"
                zIndex={0}
                borderRadius="full"
                bg="bg.canvas"
            >
                <TokenLogo
                    src={baseAssetLogo}
                    symbol={baseAssetSymbol}
                    size={size}
                    circular={true}
                />
            </Box>
            {/* Quote asset logo - overlapping to the right */}
            <Box
                position="relative"
                zIndex={1}
                ml="-3"
                borderRadius="full"
                bg="bg.canvas"
            >
                <TokenLogo
                    src={quoteAssetLogo}
                    symbol={quoteAssetSymbol}
                    size={size}
                    circular={true}
                />
            </Box>
        </Box>
    );
};
