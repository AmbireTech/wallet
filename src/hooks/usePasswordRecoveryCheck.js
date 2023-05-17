import { useEffect, useState } from 'react'
import { useRelayerData } from 'hooks'
import { AbiCoder, keccak256 } from 'ethers/lib/utils'

const REFRESH_INTVL = 30 * 1000

export default function usePasswordRecoveryCheck(relayerURL, currentAccount, selectedNetwork) {
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  const [relayerData, setRelayerData] = useState(null)

  // for UX, avoiding banner flickering when refreshing same acc and network
  const [accountNetworkPair, setAccountNetworkPair] = useState(null)
  const [isPasswordRecoveryCheckLoading, setIsPasswordRecoveryCheckLoading] = useState(null)
  const [isRefreshingOnly, setIsRefreshingOnly] = useState(null)

  useEffect(() => {
    if (Date.now() - cacheBreak > REFRESH_INTVL) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), REFRESH_INTVL)
    return () => clearTimeout(intvl)
  }, [cacheBreak, currentAccount, selectedNetwork])

  const url = relayerURL
    ? `${relayerURL}/identity/${currentAccount.id}/${selectedNetwork.id}/privileges?cacheBreak=${cacheBreak}`
    : null

  const { data, errMsg, isLoading } = useRelayerData({ url })

  useEffect(() => {
    const privileges = data ? data.privileges : {}
    const recoveryLock = data && data.recoveryLock

    const accHash = (signer) => {
      const abiCoder = new AbiCoder()
      const { timelock, one, two } = signer
      return keccak256(abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]]))
    }
    const hasPendingReset =
      privileges[currentAccount.signer.quickAccManager] &&
      ((recoveryLock && recoveryLock.status && !isLoading) ||
        (privileges &&
          currentAccount.signer.quickAccManager &&
          // is or has been in recovery state
          currentAccount.signer.preRecovery &&
          // but that's not finalized yet
          accHash(currentAccount.signer) !== privileges[currentAccount.signer.quickAccManager]))

    setRelayerData({
      hasPendingReset,
      errMsg,
      recoveryLock
    })

    // Avoid flickering when refreshing only...
    // when data is loaded
    if (!isLoading) {
      // if same account and network
      if (accountNetworkPair === currentAccount?.id + selectedNetwork.id) {
        // refresh mode only ON
        setIsRefreshingOnly(true)
        setIsPasswordRecoveryCheckLoading(false)
        // else if an account or network change occurred
      } else {
        setAccountNetworkPair(currentAccount?.id + selectedNetwork.id)
        // refresh mode only OFF, until isLoading is again true
        setIsRefreshingOnly(false)
      }
    } else if (isRefreshingOnly) {
      setIsPasswordRecoveryCheckLoading(false)
    } else {
      setIsPasswordRecoveryCheckLoading(isLoading)
    }
  }, [
    data,
    errMsg,
    isLoading,
    currentAccount,
    accountNetworkPair,
    selectedNetwork.id,
    isRefreshingOnly
  ])

  return {
    data,
    isPasswordRecoveryCheckLoading,
    ...relayerData
  }
}
