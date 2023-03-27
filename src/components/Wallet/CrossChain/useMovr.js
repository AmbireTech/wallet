import { useCallback } from 'react'
import { fetchGet, fetchPost } from 'lib/fetch'

const SOCKET_KEY = '70cd11c0-30ae-41e8-8e7d-6f25077bb74a'
const baseURL = 'https://api.socket.tech/v2'

async function fetchSocket(path, body, type = 'get') {
  const response =
    type === 'get'
      ? await fetchGet(`${baseURL}${path}`, { headers: { 'API-KEY': SOCKET_KEY } })
      : await fetchPost(`${baseURL}${path}`, body, { headers: { 'API-KEY': SOCKET_KEY } })
  if (!response) return null
  return response.result
}

const useMovr = () => {
  const fetchChains = useCallback(async () => {
    return await fetchSocket('/supported/chains')
  }, [])

  const fetchFromTokens = useCallback(async (from, to) => {
    return await fetchSocket(`/token-lists/from-token-list?fromChainId=${from}&toChainId=${to}`)
  }, [])

  const fetchToTokens = useCallback(async (from, to) => {
    return await fetchSocket(`/token-lists/to-token-list?fromChainId=${from}&toChainId=${to}`)
  }, [])

  const fetchQuotes = useCallback(
    async (
      identity,
      fromAsset,
      fromChainId,
      toAsset,
      toChainId,
      amount,
      excludeBridges,
      sort = 'output'
    ) => {
      return await fetchSocket(
        `/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromAsset}&toChainId=${toChainId}&toTokenAddress=${toAsset}&fromAmount=${amount}${excludeBridges.map(
          (b) => `&excludeBridges=${b}`
        )}&sort=${sort}&userAddress=${identity}&recipient=${identity}&singleTxOnly=true&isContractCall=true&bridgeWithGas=false`
      )
    },
    []
  )

  // const checkApprovalAllowance = useCallback(async (chainID, owner, allowanceTarget, tokenAddress) => {
  //     const response = await fetchSocket(`/approval/check-allowance?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`)
  //     return response ? response : null
  // }, [])

  const approvalBuildTx = useCallback(
    async (chainID, owner, allowanceTarget, tokenAddress, amount) => {
      return await fetchSocket(
        `/approval/build-tx?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`
      )
    },
    []
  )

  const sendBuildTx = useCallback(async (route, refuel) => {
    return await fetchSocket('/build-tx', { route, refuel }, 'post')
  }, [])

  const checkTxStatus = useCallback(async (transactionHash, fromChainId, toChainId) => {
    return await fetchSocket(
      `/bridge-status?transactionHash=${transactionHash}&fromChainId=${fromChainId}&toChainId=${toChainId}`
    )
  }, [])

  return {
    fetchChains,
    fetchToTokens,
    fetchFromTokens,
    fetchQuotes,
    // checkApprovalAllowance,
    approvalBuildTx,
    sendBuildTx,
    checkTxStatus
  }
}

export default useMovr
