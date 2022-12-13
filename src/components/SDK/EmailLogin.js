import BaseEmailLogin from 'components/EmailLogin/EmailLogin'
import { useState, useEffect } from 'react'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import { useLocalStorage } from 'hooks'
import allNetworks from 'consts/networks'
import { getProvider } from 'ambire-common/src/services/provider'
import { useLocation } from 'react-router-dom'
import { Loading } from 'components/common'

export default function EmailLogin({ relayerURL, onAddAccount }) {
  const location = useLocation()
  const { network, setNetwork } = useNetwork({ useStorage: useLocalStorage })

  // login state stuff
  const [alreadyLogged, setAlreadyLogged] = useState(false)
  const [stateStorage, setStateStorage] = useLocalStorage({
    key: 'login_sdk',
    defaultValue: {connected_dapps: []}
  })

  const dappOrigin = new URLSearchParams(location.search).get("dappOrigin")
  const chainId = parseInt(new URLSearchParams(location.search).get("chainId"))

  const matchedDapp = stateStorage.connected_dapps.find(dapp => dapp.origin === dappOrigin)
  const dappIsConnected = !!(matchedDapp && matchedDapp.wallet_address)

  // already logged-in logic
  useEffect(() => {
    if (chainId || alreadyLogged || !dappIsConnected) return

    const provider = getProvider(network.id)

    window.parent.postMessage({
      address: matchedDapp.wallet_address,
      chainId: network.chainId,
      providerUrl: provider.connection.url,
      type: 'alreadyLoggedIn',
    }, '*')

    setAlreadyLogged(true)

  }, [alreadyLogged, dappIsConnected, matchedDapp, chainId, network.id, network.chainId])

  const onLoginSuccess = (wallet_address) => {
    if (chainId) setNetwork(chainId)

    const networkId = chainId
      ? allNetworks.filter(aNetwork => aNetwork.chainId === chainId)[0].id
      : network.id
    const provider = getProvider(networkId)

    window.parent.postMessage({
      address: wallet_address,
      chainId: network.chainId,
      providerUrl: provider.connection.url,
      type: 'loginSuccess',
    }, '*')

    setStateStorage({connected_dapps: [
      ...stateStorage.connected_dapps,
      {
        origin: dappOrigin,
        wallet_address: wallet_address,
      }
    ]})
  }

  const confirmNetworkSwitch = () => {
    setNetwork(chainId)

    const networkId = allNetworks.filter(aNetwork => aNetwork.chainId === chainId)[0].id
    const provider = getProvider(networkId)

    window.parent.postMessage({
      address: matchedDapp.wallet_address,
      chainId: network.chainId,
      providerUrl: provider.connection.url,
      type: 'loginSuccess',
    }, '*')
  }

  const rejectNetworkSwitch = () => {
    // TODO
  }

  return (
    !dappIsConnected
    ? <BaseEmailLogin
        relayerURL={relayerURL}
        onAddAccount={onAddAccount}
        isSDK={true}
        onLoginSuccess={onLoginSuccess}
      ></BaseEmailLogin>
    : chainId
      ? <div>
          <h2>Allow site to switch the network?</h2>
          <button onClick={confirmNetworkSwitch}>Confirm</button>
          <button onClick={rejectNetworkSwitch}>Reject</button>
        </div>
      : <Loading></Loading>
  )
}