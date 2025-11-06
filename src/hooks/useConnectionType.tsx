import {useAssetsContext} from "@/hooks/useAssets";

export function useConnectionType() {
    const {connectionType, updateConnectionType} = useAssetsContext()

    return {
        connectionType,
        updateConnectionType,
    }
}
