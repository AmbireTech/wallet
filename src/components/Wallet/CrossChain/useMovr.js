import { useCallback } from 'react'
import { fetchGet, fetchPost } from 'lib/fetch'

const SOCKET_KEY = 'edf93074-4aae-4181-b311-a6a18566d3d0'
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
    return fetchSocket('/supported/chains')
  }, [])

  const fetchFromTokens = useCallback(async (from, to) => {
    return fetchSocket(
      `/token-lists/from-token-list?fromChainId=${from}&toChainId=${to}&isShortList=true`
    )
  }, [])

  const fetchToTokens = useCallback(async (from, to) => {
    return fetchSocket(
      `/token-lists/to-token-list?fromChainId=${from}&toChainId=${to}&isShortList=true`
    )
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
      return fetchSocket(
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
      return fetchSocket(
        `/approval/build-tx?chainID=${chainID}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`
      )
    },
    []
  )

  const sendBuildTx = useCallback(async (route, refuel) => {
    return fetchSocket('/build-tx', { route, refuel }, 'post')
  }, [])

  const checkTxStatus = useCallback(async (transactionHash, fromChainId, toChainId) => {
    return fetchSocket(
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
