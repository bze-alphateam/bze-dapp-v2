import BigNumber from 'bignumber.js';

export function toBigNumber(amount: string | number | BigNumber | bigint): BigNumber {
    if (typeof amount === "string" || typeof amount === "number" || typeof amount === "bigint") {
        amount = new BigNumber(amount);
    }

    return amount;
}

export function uAmountToAmount(amount: string | number | BigNumber | bigint | undefined, noOfDecimals: number): string {
    return uAmountToBigNumberAmount(amount, noOfDecimals).toString();
}

export function uAmountToBigNumberAmount(amount: string | number | BigNumber | bigint | undefined, noOfDecimals: number): BigNumber {
    return toBigNumber(amount || 0)
        .shiftedBy((-1) * noOfDecimals)
        .decimalPlaces(noOfDecimals || 6)
}

export function amountToBigNumberUAmount(amount: string | number | BigNumber | bigint, noOfDecimals: number): BigNumber {
    return toBigNumber(amount)
        .shiftedBy(noOfDecimals)
        .decimalPlaces(noOfDecimals || 6);
}

export function amountToUAmount(amount: string | number | BigNumber | bigint, noOfDecimals: number): string {
    return amountToBigNumberUAmount(amount, noOfDecimals).toString();
}

export function prettyAmount(amount: number | string | BigNumber | bigint): string {
    const num = toBigNumber(amount)
    if (num.isNaN()) {
        return "0";
    }

    return Intl.NumberFormat('en', {notation: 'standard'}).format(num.toNumber());
}
