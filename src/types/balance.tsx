import BigNumber from "bignumber.js";

export interface Balance {
    denom: string;
    amount: BigNumber;
}
