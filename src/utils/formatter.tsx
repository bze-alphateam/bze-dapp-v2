import BigNumber from 'bignumber.js';

export const formatUsdAmount = (priceNum: BigNumber): string => {
    const price = priceNum.toString();
    // Find the decimal point index
    const decimalIndex = price.indexOf('.');

    if (decimalIndex === -1) {
        // If there's no decimal point, return the number as is
        return price;
    }

    const decimalPart = price.substring(decimalIndex + 1);
    let significantDigitCount = 0;
    let decimalsFound = 0;

    // Iterate through each character in the decimal part
    for (let i = 0; i < decimalPart.length; i++) {
        const digit = decimalPart[i];
        decimalsFound++;

        if (digit !== '0' || significantDigitCount > 0) {
            significantDigitCount++;
        }

        // Stop if we have collected four significant digits
        if (significantDigitCount >= 6) {
            break;
        }
    }

    // Construct the final number
    return priceNum.toFixed(decimalsFound).toString();
}

export function shortNumberFormat(amount: BigNumber): string {
    if (amount.isNaN() || amount.isZero()) {
        return '0';
    }

    // Show 0 for values below 0.001
    if (amount.lt(0.001)) {
        return '0';
    }

    // Define the suffixes and their corresponding values
    const units = [
        { value: new BigNumber('1e15'), suffix: 'Q' },  // Quadrillion
        { value: new BigNumber('1e12'), suffix: 'T' },  // Trillion
        { value: new BigNumber('1e9'), suffix: 'B' },   // Billion
        { value: new BigNumber('1e6'), suffix: 'M' },   // Million
        { value: new BigNumber('1e3'), suffix: 'K' },   // Thousand
    ];

    // Find the appropriate unit
    for (const unit of units) {
        if (amount.gte(unit.value)) {
            const formatted = amount.div(unit.value);

            // Always show 3 decimal places, then remove trailing zeros
            const result = formatted.toFixed(3).replace(/\.?0+$/, '');

            return `${result}${unit.suffix}`;
        }
    }

    // For numbers below 1000, show the entire number with up to 3 decimals
    return amount.toFixed(3).replace(/\.?0+$/, '');
}

export const intlDateFormat = new Intl.DateTimeFormat("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
});
