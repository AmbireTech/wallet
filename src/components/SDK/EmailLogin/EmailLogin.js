import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import { getProvider } from 'ambire-common/src/services/provider'

import allNetworks from 'consts/networks'

import { useLocalStorage } from 'hooks'
import { Loading } from 'components/common'
import BaseEmailLogin from 'components/EmailLogin/EmailLogin'
import { useSDKContext } from 'components/SDKProvider/SDKProvider'
import SwitchNetwork from './SwitchNetwork/SwitchNetwork'

import styles from './EmailLogin.module.scss'

export default function EmailLogin({ relayerURL, onAddAccount }) {
  const location = useLocation()
  const { setDappQuery } = useSDKContext()
  const { network, setNetwork } = useNetwork({ useStorage: useLocalStorage })

  // login state stuff
  const [alreadyLogged, setAlreadyLogged] = useState(false)
  const [stateStorage, setStateStorage] = useLocalStorage({
    key: 'login_sdk',
    defaultValue: { connected_dapps: [] },
  })

  const dappOrigin = new URLSearchParams(location.search).get('dappOrigin')
  const dappName = new URLSearchParams(location.search).get('dappName')
  const dappIcon = new URLSearchParams(location.search).get('dappIcon')
  const chainId = parseInt(new URLSearchParams(location.search).get('chainId'))
  const validTargetNetwork = allNetworks.filter((network) => network.chainId === chainId)[0]

  const matchedDapp = stateStorage.connected_dapps.find((dapp) => dapp.origin === dappOrigin)
  const dappIsConnected = !!(matchedDapp && matchedDapp.wallet_address)

  console.log(location.search)
  useEffect(() => {
    setDappQuery(location.search)
  }, [location.search, setDappQuery])
  // already logged-in logic
  useEffect(() => {
    if (
      !dappIsConnected
      || (alreadyLogged && !chainId)
      || (chainId && network.id !== validTargetNetwork?.id)
    ) return

    const provider = getProvider(network.id)

    window.parent.postMessage(
      {
        address: matchedDapp.wallet_address,
        chainId: network.chainId,
        providerUrl: provider.connection.url,
        type: 'alreadyLoggedIn',
      },
      '*'
    )

    setAlreadyLogged(true)
  }, [alreadyLogged, dappIsConnected, matchedDapp, chainId, network.id, network.chainId])

  const onLoginSuccess = (wallet_address) => {
    if (validTargetNetwork) setNetwork(validTargetNetwork.id)

    const targetNetwork = validTargetNetwork ? validTargetNetwork : network
    const provider = getProvider(targetNetwork.id)

    window.parent.postMessage(
      {
        address: wallet_address,
        chainId: targetNetwork.chainId,
        providerUrl: provider.connection.url,
        type: 'loginSuccess',
      },
      '*'
    )

    setStateStorage({
      connected_dapps: [
        ...stateStorage.connected_dapps,
        {
          origin: dappOrigin,
          name: dappName,
          icon: dappIcon ?? '',
          wallet_address: wallet_address,
        },
      ],
    })
  }

  const confirmNetworkSwitch = () => {
    setNetwork(validTargetNetwork.id)

    const provider = getProvider(validTargetNetwork.id)

    window.parent.postMessage(
      {
        address: matchedDapp.wallet_address,
        chainId: validTargetNetwork.chainId,
        providerUrl: provider.connection.url,
        type: 'loginSuccess',
      },
      '*'
    )
  }

  const rejectNetworkSwitch = () => {
    const provider = getProvider(network.id)

    window.parent.postMessage(
      {
        address: matchedDapp.wallet_address,
        chainId: network.chainId,
        providerUrl: provider.connection.url,
        type: 'actionRejected',
      },
      '*'
    )
  }

  if (chainId && !validTargetNetwork) {
    return <SwitchNetwork onConfirm={confirmNetworkSwitch} onReject={rejectNetworkSwitch} supported={false} />
  }

  if (!dappIsConnected) {
    return (
      <BaseEmailLogin
        relayerURL={relayerURL}
        onAddAccount={onAddAccount}
        isSDK={true}
        onLoginSuccess={onLoginSuccess}
        className={styles.emailLogin}
      />
    )
  }

  // network.id !== validTargetNetwork.id prevents the user from seeing the same Network in Switch Network
  if (chainId && dappIsConnected && (network.id !== validTargetNetwork.id)) {
    return (
      <SwitchNetwork
        fromNetworkId={network.id}
        fromNetworkName={network.name}
        toNetworkId={validTargetNetwork.id}
        toNetworkName={validTargetNetwork.name}
        onConfirm={confirmNetworkSwitch}
        onReject={rejectNetworkSwitch}
        supported
      />
    )
  }

  return <Loading />
}
