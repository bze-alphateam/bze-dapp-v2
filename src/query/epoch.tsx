
import {QueryEpochsInfoResponseSDKType} from "@bze/bzejs/bze/epochs/query";
import {getRestClient} from "@/query/client";

export async function getEpochsInfo(): Promise<QueryEpochsInfoResponseSDKType> {
    try {
        const client = await getRestClient();

        return client.bze.epochs.epochInfos();
    } catch (e) {
        console.error(e);

        return {epochs: []};
    }
}
