import BaseAddAccount from 'components/AddAccount/AddAccount'
import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocalStorage } from 'hooks'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import { getProvider } from 'ambire-common/src/services/provider'
import styles from './AddAccount.module.scss'

const AddAccount = ({ relayerURL, onAddAccount, utmTracking, pluginData }) => {
  const { network } = useNetwork({ useStorage: useLocalStorage })
  const location = useLocation()
  const [stateStorage, setStateStorage] = useLocalStorage({
    key: 'login_sdk',
    defaultValue: { connected_dapps: [] },
  })

  const dappOrigin = useMemo(() => new URLSearchParams(location.search).get('dappOrigin'), [location])
  const dappName = useMemo(() => new URLSearchParams(location.search).get('dappName'), [location])
  const dappIcon = useMemo(() => new URLSearchParams(location.search).get('dappIcon'), [location])

  const onSDKRegisterSuccess = useCallback((wallet_address) => {
    const provider = getProvider(network.id)

    window.parent.postMessage({
      address: wallet_address,
      chainId: network.chainId,
      providerUrl: provider.connection.url,
      type: 'registrationSuccess',
    }, '*')

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
  }, [network.id, network.chainId, stateStorage, setStateStorage, dappOrigin, dappName, dappIcon])

  return (
    <BaseAddAccount
      relayerURL={relayerURL}
      onAddAccount={onAddAccount}
      utmTracking={utmTracking}
      pluginData={pluginData}
      isSDK={true}
      onSDKRegisterSuccess={onSDKRegisterSuccess}
      className={styles.wrapper}
    />
  )
}

export default AddAccount
