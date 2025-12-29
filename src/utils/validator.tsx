/**
 * Get list of denoms supported by BZE Validator for AtomOne program
 */
export const getValidatorSupportedDenoms = (): string[] => {
    const denoms = process.env.NEXT_PUBLIC_ATONE_VALIDATOR_SUPPORTED_DENOMS || '';
    return denoms.split(',').map(d => d.trim()).filter(d => d.length > 0);
}

/**
 * Get AtomOne validator page URL
 */
export const getValidatorPageUrl = (): string => {
    return process.env.NEXT_PUBLIC_ATONE_VALIDATOR_PAGE_URL || '';
}

/**
 * Check if a pool is supported by BZE Validator
 * Returns true if either base or quote asset matches a supported denom
 */
export const isPoolSupportedByValidator = (baseDenom: string, quoteDenom: string): boolean => {
    const supportedDenoms = getValidatorSupportedDenoms();
    return supportedDenoms.includes(baseDenom) || supportedDenoms.includes(quoteDenom);
}
