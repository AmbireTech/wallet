import { useCallback } from "react";
import { fetchGet } from "lib/fetch";

const SOCKET_KEY = '70cd11c0-30ae-41e8-8e7d-6f25077bb74a'

// const baseURL = 'https://backend.movr.network/v2'
const baseURL = 'https://api.socket.tech/v2'
// const watcherBaseURL = 'https://watcherapi.fund.movr.network/api/v2'

async function fetchSocket(path) {
    const response = await fetchGet(`${baseURL}${path}`, { headers: {'API-KEY': SOCKET_KEY } });
    if (!response) return null
    return response.result
}

const useMovr = () => {
    const fetchChains = useCallback(async () => {
        // const response = await fetchGet(`https://backend.movr.network/v1/supported/chains`)
        return fetchSocket(`/supported/chains`)
    }, [])

    const fetchFromTokens = useCallback(async (from, to) => {
        // const response = await fetchGet(`${baseURL}/supported/from-token-list?fromChainId=${from}&toChainId=${to}`)
        const response = await fetchSocket(`/token-lists/from-token-list?fromChainId=${from}&toChainId=${to}`)
        if (!response) return null
        return response //.map(({ token }) => token)
    }, [])

    const fetchToTokens = useCallback(async (from, to) => {
        // const response = await fetchGet(`${baseURL}/supported/to-token-list?fromChainId=${from}&toChainId=${to}`)
        const response = await fetchSocket(`/token-lists/to-token-list?fromChainId=${from}&toChainId=${to}`)
        if (!response) return null
        return response //.map(({ token }) => token)
    }, [])

    const fetchQuotes = useCallback(async (identity, fromAsset, fromChainId, toAsset, toChainId, amount, excludeBridges, sort = 'gas') => {
        const response = await fetchSocket(`/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromAsset}&toChainId=${toChainId}&toTokenAddress=${toAsset}&fromAmount=${amount}&excludeBridges=${excludeBridges}&sort=${sort}&userAddress=${identity}&recipient=${identity}&singleTxOnly=true`)
        return response ? response : null
    }, [])

    const checkApprovalAllowance = useCallback(async (chainID, owner, allowanceTarget, tokenAddress) => {
        const response = await fetchSocket(`/approval/check-allowance?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`)
        return response ? response : null
    }, [])

    const approvalBuildTx = useCallback(async (chainID, owner, allowanceTarget, tokenAddress, amount) => {
        const response = await fetchSocket(`/approval/build-tx?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`)
        return response ? response : null
    }, [])

    const sendBuildTx = useCallback(async (recipient, fromAsset, fromChainId, toAsset, toChainId, amount, output, routePath) => {
        const response = await fetchSocket(`/send/build-tx?recipient=${recipient}&fromAsset=${fromAsset}&fromChainId=${fromChainId}&toAsset=${toAsset}&toChainId=${toChainId}&amount=${amount}&output=${output}&fromAddress=${recipient}&routePath=${routePath}`)
        return response ? response : null
    }, [])

    const checkTxStatus = useCallback(async (transactionHash, fromChainId, toChainId) => {
        const response = await fetchSocket(`/transaction-status?transactionHash=${transactionHash}&fromChainId=${fromChainId}&toChainId=${toChainId}`)
        console.log({response});
        return response ? response : null
    }, [])

    return {
        fetchChains,
        fetchToTokens,
        fetchFromTokens,
        fetchQuotes,
        checkApprovalAllowance,
        approvalBuildTx,
        sendBuildTx,
        checkTxStatus
    }
}

export default useMovr