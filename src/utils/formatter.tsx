
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
