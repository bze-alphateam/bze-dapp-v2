'use client';

import { Box, Image } from '@chakra-ui/react';
import { useState } from 'react';
import type { ImageProps } from '@chakra-ui/react';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
    fallback?: React.ReactNode;
    fallbackText?: string;
}

export const ImageWithFallback = ({
                                      src,
                                      alt,
                                      fallback,
                                      fallbackText,
                                      ...props
                                  }: ImageWithFallbackProps) => {
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError) {
        return fallback || (
            <Box
                w="full"
                h="full"
                bg="bg.surface"
                borderColor="border.subtle"
                borderWidth="1px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                color="fg.muted"
                {...props}
            >
                {fallbackText || (alt ? alt.charAt(0).toUpperCase() : '?')}
            </Box>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            onError={handleError}
            {...props}
        />
    );
};