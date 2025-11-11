import {toBigNumber} from "@/utils/amount";

export const sanitizeNumberInput = (input: string) => {
    // Regular expression to match all characters not allowed in a non-negative number
    // Allow digits and a single decimal point
    let sanitized = input.replace(/[^0-9.,]/g, '');
    sanitized = sanitized.replace(",", ".");

    // Ensure only one decimal point is present
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        // Join parts after the first '.' back into the first part
        sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    return sanitized;
}

export const sanitizeIntegerInput = (input: string): string => {
    if (input.length === 0) {
        return "";
    }

    // Regular expression to match all characters not allowed in an integer number (digits only)
    const sanitized = input.replace(/[^0-9]/g, '');

    // Parse the sanitized string as an integer and return it
    const parsed = parseInt(sanitized, 10); // Return 0 if parsing fails
    if (!parsed) {
        return "1";
    }

    return `${parsed}`;
}

export const toPercentage = (dec: number|bigint|BigNumber|string) => toBigNumber(dec).multipliedBy(100).decimalPlaces(2).toString();
