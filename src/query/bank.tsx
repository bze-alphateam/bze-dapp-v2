import {getRestClient} from "@/query/client";
import {Coin} from "@bze/bzejs/cosmos/base/v1beta1/coin";

export async function getAddressBalances(address: string): Promise<Coin[]> {
    try {
        const client = await getRestClient();
        const response = await client.cosmos.bank.v1beta1.spendableBalances({address: address});

        return response.balances;
    } catch (e) {
        console.error("failed to get balances",e);

        return [];
    }
}
