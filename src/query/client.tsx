import {getSettings} from "@/storage/settings";
import {bze} from '@bze/bzejs';

export const getRestClient = () => {
    const settings = getSettings()

    return createRestClient(settings.endpoints.restEndpoint)
}

export const createRestClient = async (endpoint: string): Promise<ReturnType<typeof bze.ClientFactory.createLCDClient>> => {
    return bze.ClientFactory.createLCDClient({restEndpoint: endpoint})
}
