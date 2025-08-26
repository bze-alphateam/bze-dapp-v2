
export interface Asset {
    type: string; //ibc, factory or native
    denom: string; //base denom (blockchain denom)
    decimals: number; //exponent
    name: string;
    ticker: string;
    logo: string; //logo or placeholder
    stable: boolean; //is stablecoin
    verified: boolean; //is verified
    supply: bigint; //total supply on BZE chain
}
