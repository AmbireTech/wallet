import BaseEmailLogin from 'components/EmailLogin/EmailLogin'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import { useLocalStorage } from 'hooks'
import allNetworks from 'consts/networks'
import { getProvider } from 'ambire-common/src/services/provider'
import { useLocation } from 'react-router-dom'

export default function EmailLogin({ relayerURL, onAddAccount }) {
  const location = useLocation()
  const { network, setNetwork } = useNetwork({ useStorage: useLocalStorage })

  const onLoginSuccess = (wallet_address) => {
    const chainId = parseInt(new URLSearchParams(location.search).get("chainId"))

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
  }

  return (
    <BaseEmailLogin
      relayerURL={relayerURL}
      onAddAccount={onAddAccount}
      isSDK={true}
      onLoginSuccess={onLoginSuccess}
    ></BaseEmailLogin>
  )
}