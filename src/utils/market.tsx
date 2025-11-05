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

//calculates min amount of an order just like tradebin module does
export const getMinAmount = (uPrice: string|BigNumber, noOfDecimals: number): BigNumber => {
    //taken from tradebin module
    const uPriceDec = toBigNumber(uPrice);
    if (uPriceDec.lte(0)) {
        return new BigNumber(0);
    }

    //calculate minimum uAmount
    const oneDec = new BigNumber(1);
    const amtDec = oneDec.dividedBy(uPriceDec).decimalPlaces(0, BigNumber.ROUND_CEIL).multipliedBy(2);

    //transform uAmount to amount
    //IMPORTANT: multiply by 2 to avoid the case when an order can not be filled and the amount is sent back to user
    //making him lose trading fees without any feedback on why the order is failing. See Tradebin "getExecutedAmount" function
    return amtDec.shiftedBy((-1) * noOfDecimals).decimalPlaces(noOfDecimals || 6).multipliedBy(2);
}
