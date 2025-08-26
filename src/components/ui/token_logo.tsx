'use client';

import { Box } from '@chakra-ui/react';
import type { ImageProps } from '@chakra-ui/react';
import {ImageWithFallback} from "@/components/ui/image";

interface TokenLogoProps extends Omit<ImageProps, 'src' | 'alt' | 'rounded'> {
    /** Token logo URL */
    src?: string;
    /** Token symbol for alt text and fallback text */
    symbol: string;
    /** Size of the token logo (applies to both width and height) */
    size?: string | number;
    /** Custom fallback component (if not provided, uses token.svg) */
    customFallback?: React.ReactNode;
    /** Whether to show circular logo (default: true) */
    circular?: boolean;
}

export const TokenLogo = ({
                              src,
                              symbol,
                              size = "8",
                              customFallback,
                              circular = true,
                              ...props
                          }: TokenLogoProps) => {
    const fallbackComponent = customFallback || (
        <ImageWithFallback
            src="/images/token.svg"
            alt="Default token"
            w="full"
            h="full"
            objectFit="cover"
            fallback={
                <Box
                    w="full"
                    h="full"
                    bg="bg.surface"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    color="fg.muted"
                    borderRadius={circular ? "full" : "md"}
                >
                    {symbol.charAt(0).toUpperCase()}
                </Box>
            }
        />
    );

    return (
        <Box
            w={size}
            h={size}
            borderRadius={circular ? "full" : "md"}
            overflow="hidden"
            bg="bg.surface"
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            {src ? (
                <ImageWithFallback
                    src={src}
                    alt={`${symbol} token logo`}
                    w="full"
                    h="full"
                    objectFit="contain"
                    fallback={fallbackComponent}
                    {...props}
                />
            ) : (
                fallbackComponent
            )}
        </Box>
    );
};