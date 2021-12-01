import { fetchGet } from "../lib/fetch";

const baseURL = 'https://backend.movr.network/v1'

const fetchChains = async () => {
    const response = await fetchGet(`${baseURL}/supported/chains`)
    if (!response) return null
    return response.result
}

const fetchFromTokens = async (from, to) => {
    const response = await fetchGet(`${baseURL}/supported/from-token-list?fromChainId=${from}&toChainId=${to}`)
    if (!response) return null
    return response.result.map(({ token }) => token)
}

const fetchToTokens = async (from, to) => {
    const response = await fetchGet(`${baseURL}/supported/to-token-list?fromChainId=${from}&toChainId=${to}`)
    if (!response) return null
    return response.result.map(({ token }) => token)
}

const fetchQuotes = async (fromAsset, fromChainId, toAsset, toChainId, amount, sort = 'cheapestRoute') => {
    const response = await fetchGet(`${baseURL}/quote?fromAsset=${fromAsset}&fromChainId=${fromChainId}&toAsset=${toAsset}&toChainId=${toChainId}&amount=${amount}&sort=${sort}`)
    if (!response) return null
    return response.result
}

const checkApprovalAllowance = async (chainID, owner, allowanceTarget, tokenAddress) => {
    const response = await fetchGet(`${baseURL}/approval/check-allowance?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`)
    if (!response) return null
    return response.result
}

const approvalBuildTx = async (chainID, owner, allowanceTarget, tokenAddress, amount) => {
    const response = await fetchGet(`${baseURL}/approval/build-tx?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`)
    if (!response) return null
    return response.result
}

const sendBuildTx = async (recipient, fromAsset, fromChainId, toAsset, toChainId, amount, output, routePath) => {
    const response = await fetchGet(`${baseURL}/send/build-tx?recipient=${recipient}&fromAsset=${fromAsset}&fromChainId=${fromChainId}&toAsset=${toAsset}&toChainId=${toChainId}&amount=${amount}&output=${output}&fromAddress=${recipient}&routePath=${routePath}`)
    if (!response) return null
    return response.result
}

export {
    fetchChains,
    fetchToTokens,
    fetchFromTokens,
    fetchQuotes,
    checkApprovalAllowance,
    approvalBuildTx,
    sendBuildTx
}