import {coins, DeliverTxResponse, isDeliverTxSuccess} from '@cosmjs/stargate';
import {useChain} from "@interchain-kit/react";
import {getChainExplorerURL, getChainName} from "@/constants/chain";
import {useToast} from "@/hooks/useToast";
import {prettyError} from "@/utils/user_errors";
import {getChainNativeAssetDenom} from "@/constants/assets";
import {EncodeObject, StdFee} from "interchainjs/types";
import {useSigningClient} from "@/hooks/useSigningClient";
import {openExternalLink, sleep} from "@/utils/functions";
import BigNumber from "bignumber.js";
import {DEFAULT_TX_MEMO} from "@/constants/placeholders";
import {useCallback, useMemo, useState} from "react";

interface TxOptions {
    fee?: StdFee | null;
    onSuccess?: (res: DeliverTxResponse) => void;
    onFailure?: (err: string) => void;
    memo?: string;
    progressTrackerTimeout?: number
}

export enum TxStatus {
    Failed = 'Transaction Failed',
    Successful = 'Transaction Successful',
    Broadcasting = 'Transaction Pending',
}

const defaultFee = {
    amount: coins(20000, getChainNativeAssetDenom()),
    gas: "500000"
}

export const useSDKTx = (chainName?: string) => {
    const {tx, progressTrack} = useTx(chainName ?? getChainName(), true, false);

    return {
        tx,
        progressTrack
    }
}

export const useBZETx = () => {
    const {tx, progressTrack} = useTx(getChainName(), false, false);

    return {
        tx,
        progressTrack,
    }
}

export const useIBCTx = (chainName?: string) => {
    const {tx, progressTrack} = useTx(chainName ?? getChainName(), false, true);

    return {
        tx,
        progressTrack
    }
}

const useTx = (chainName: string, isCosmos: boolean, isIBC: boolean) => {
    const {address} = useChain(chainName);
    const {toast} = useToast();
    const {signingClient, isSigningClientReady, signingClientError} = useSigningClient({chainName: chainName, isCosmos: isCosmos, isIbc: isIBC});
    const [progressTrack, setProgressTrack] = useState("")

    const defaultChainName = useMemo(() => getChainName(), []);

    const canUseClient = useCallback(async () => {
        if (!isSigningClientReady) {
            //TODO: this is a hack to make sure the signing client is ready. Remove this when we have a better way to
            // do this
            console.error("waiting for signing client to be ready", signingClientError)

            await sleep(1_000)
        }

        return isSigningClientReady
    }, [isSigningClientReady, signingClientError]);

    const simulateFee = useCallback(async (messages: EncodeObject[], memo: string | undefined): Promise<StdFee> => {
        try {
            const gasPrice = 0.02;
            const gasDenom = getChainNativeAssetDenom();
            // @ts-expect-error is checked above
            const gasEstimated = await signingClient.simulate(address, messages, memo);

            const gasAmount = BigNumber(gasEstimated).multipliedBy(1.5);
            const gasPayment = gasAmount.multipliedBy(gasPrice).toFixed(0).toString();
            return {
                amount: coins(gasPayment, gasDenom),
                gas: gasAmount.toFixed(0)
            };

        } catch (e) {
            console.error("failed to get gas", e);
            setProgressTrack("Using default fee")

            return defaultFee
        }
    }, [signingClient, address]);

    const getFee = useCallback(async (messages: EncodeObject[], options?: TxOptions|undefined): Promise<StdFee> => {
        try {
            if (options?.fee) {
                return options.fee;
            } else {
                setProgressTrack("Simulating transaction")
                return await simulateFee(messages, options?.memo);
            }
        } catch (e) {
            console.error(e);
            // @ts-expect-error - small chances for e to be undefined
            toast.error('Failed to get signing client', e.message ?? 'An unexpected error has occurred')

            setProgressTrack("Using default fee")
            return defaultFee;
        }
    }, [simulateFee, toast]);

    const tx = useCallback(async (msgs: EncodeObject[], options?: TxOptions|undefined) => {
        if (!address) {
            toast.error(TxStatus.Failed, 'Please connect the wallet')
            return;
        }

        if (!(await canUseClient())) {
            toast.error(TxStatus.Failed, 'Can not find suitable signing client')
            return;
        }

        setProgressTrack("Getting fee")
        const fee = await getFee(msgs, options);
        const broadcastToastId = toast.loading(TxStatus.Broadcasting,'Waiting for transaction to be signed and included in block')
        if (signingClient) {
            try {
                setProgressTrack("Signing transaction")
                const resp = await signingClient.signAndBroadcast(address, msgs, fee, options?.memo ?? DEFAULT_TX_MEMO)
                if (isDeliverTxSuccess(resp)) {
                    setProgressTrack("Transaction sent")
                    toast.clickableSuccess(TxStatus.Successful, () => {openExternalLink(`${getChainExplorerURL(chainName ?? defaultChainName)}/tx/${resp.transactionHash}`)}, 'View in Explorer');

                    if (options?.onSuccess) {
                        options.onSuccess(resp)
                    }
                } else {
                    setProgressTrack("Transaction failed")
                    toast.error(TxStatus.Failed, prettyError(resp?.rawLog));
                    if (options?.onFailure) {
                        options.onFailure(prettyError(resp?.rawLog) || "Unknown error")
                    }
                }
            } catch (e) {
                console.error(e);
                // @ts-expect-error - small chances for e to be undefined
                toast.error(TxStatus.Failed, prettyError(e?.message));
                if (options?.onFailure) {
                    // @ts-expect-error - small chances for e to be undefined
                    options.onFailure(prettyError(e?.message) || "Unknown error")
                }
            }
        }
        toast.dismiss(broadcastToastId);
        setTimeout(() => {
            setProgressTrack("")
        }, options?.progressTrackerTimeout || 5000)
    }, [address, canUseClient, getFee, toast, signingClient, chainName, defaultChainName]);

    return {
        tx,
        progressTrack
    };
};