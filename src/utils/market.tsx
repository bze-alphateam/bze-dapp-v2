import BigNumber from "bignumber.js";
import {toBigNumber} from "@/utils/amount";

export const createMarketId = (base: string, quote: string) => `${base}/${quote}`;

export const calculateTotalAmount = (price: string|BigNumber, amount: string|BigNumber, decimals: number): string => {
    const priceNum = toBigNumber(price);
    const amountNum = toBigNumber(amount);
    if (priceNum.isNaN() || amountNum.isNaN() || priceNum.isZero() || amountNum.isZero()) return '';

    const total = priceNum.multipliedBy(amountNum);

    return total.decimalPlaces(decimals).toString();
}

export const calculatePricePerUnit = (amount: string|BigNumber, totalPrice: string|BigNumber, decimals: number): string => {
    const amountNum = toBigNumber(amount);
    const total = toBigNumber(totalPrice);
    if (amountNum.isNaN() || total.isNaN() || amountNum.isZero() || total.isZero()) return '';

    return total.dividedBy(amountNum).decimalPlaces(decimals).toString();
}

export const calculateAmountFromPrice = (price: string|BigNumber, totalPrice: string|BigNumber, decimals: number): string => {
    const total = toBigNumber(totalPrice);
    const priceNum = toBigNumber(price);
    if (total.isNaN() || priceNum.isNaN() || total.isZero() || priceNum.isZero()) return '';

    return total.div(priceNum).decimalPlaces(decimals).toString();
}
