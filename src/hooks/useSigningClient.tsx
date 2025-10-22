import {
    getSigningBzeClient,
    getSigningCosmosClient,
    getSigningIbcClient
} from "@bze/bzejs";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useChain} from "@interchain-kit/react";
import {getChainName} from "@/constants/chain";
import {
    getArchwayRpcURL, getAtomOneRpcUrl,
    getJackalRpcUrl,
    getNobleRpcUrl,
    getOmniFlixRpcUrl,
    getOsmosisRpcUrl,
} from "@/constants/endpoints";
import {useSettings} from "@/hooks/useSettings";

interface UseSigningClientProps {
    chainName?: string;
    isIbc?: boolean;
    isCosmos?: boolean;
}

export const useSigningClient = ({chainName, isIbc, isCosmos}: UseSigningClientProps ) => {
    const {getSigningClient, signingClientError, wallet, chain} = useChain(chainName ?? getChainName());
    const [signingClient, setSigningClient] = useState<Awaited<ReturnType<typeof getSigningClient>>|null>(null);
    const [isSigningClientReady, setIsSigningClientReady] = useState(false);
    const {settings} = useSettings()
    const hasInitialized = useRef(false);

    const defaultChainName = useMemo(() => getChainName(), []);

    const createSigningClient = useCallback(async () => {
        const offlineSigner = (await getSigningClient())?.offlineSigner;
        const rpcEndpoint = settings.endpoints.rpcEndpoint.replace("wss://", "https://").replace("ws://", "http://")
        if (!offlineSigner) {
            return;
        }

        let clientFn = getSigningBzeClient
        if (isIbc) {
            clientFn = getSigningIbcClient
        } else if (isCosmos) {
            clientFn = getSigningCosmosClient
        }

        switch (chainName) {
            case defaultChainName:
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                //TODO: we should support custom rpc endpoints for all chains
                return clientFn({rpcEndpoint: rpcEndpoint, signer: offlineSigner?.offlineSigner});
            case 'archway':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getArchwayRpcURL(), signer: offlineSigner?.offlineSigner});
            case 'osmosis':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getOsmosisRpcUrl(), signer: offlineSigner?.offlineSigner});
            case 'noble':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getNobleRpcUrl(), signer: offlineSigner?.offlineSigner});
            case 'jackal':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getJackalRpcUrl(), signer: offlineSigner?.offlineSigner});
            case 'omniflixhub':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getOmniFlixRpcUrl(), signer: offlineSigner?.offlineSigner});
            case 'atomone':
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: getAtomOneRpcUrl(), signer: offlineSigner?.offlineSigner});
            default:
                //@ts-expect-error - we know that the chainName is the same as the chainName in the getSigningClient function
                return clientFn({rpcEndpoint: rpcEndpoint, signer: offlineSigner?.offlineSigner});
        }
    }, [getSigningClient, settings.endpoints.rpcEndpoint, isIbc, isCosmos, chainName, defaultChainName]);


    useEffect(() => {
        if (!wallet || !chain || hasInitialized.current) {
            return
        }

        const load = async () => {
            const client = await createSigningClient();
            if (client) {
                setSigningClient(client);
                setIsSigningClientReady(true);
                hasInitialized.current = true;
            }
        }

        load();
    }, [wallet, chain, createSigningClient]);

    return {
        signingClientError,
        signingClient,
        isSigningClientReady,
    }
};