import BaseAddAccount from 'components/AddAccount/AddAccount'
import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { fetchGet } from 'lib/fetch'
import useNetwork from 'ambire-common/src/hooks/useNetwork'
import { getProvider } from 'ambire-common/src/services/provider'

export default function AddAccount({ relayerURL, onAddAccount, utmTracking, pluginData }) {
  const [account, setAccount] = useState(null)
  const [isEmailConfirmed, setEmailConfirmed] = useState(false)
  const { network } = useNetwork({ useStorage: useLocalStorage })
  const { addToast } = useToasts()

  const checkEmailConfirmation = useCallback(async () => {
    try {
      const relayerIdentityURL = `${relayerURL}/identity/${account.id}`
      const identity = await fetchGet(relayerIdentityURL)
      if (identity) {
          const { emailConfirmed } = identity.meta
          const isConfirmed = !!emailConfirmed
          setEmailConfirmed(isConfirmed)

          if (isConfirmed) {
            onAddAccount(account, { select: true, isNew: true })

            const provider = getProvider(network.id)

            window.parent.postMessage({
              address: account.id,
              chainId: network.chainId,
              providerUrl: provider.connection.url,
              type: 'registrationSuccess',
            }, '*')
          }
      }
    } catch(e) {
      console.error(e);
      addToast('Could not check email confirmation.', { error: true })
    }
  }, [relayerURL, addToast, account, onAddAccount, network.chainId, network.id])

  useEffect(() => {
    if (!account) return
    !isEmailConfirmed && checkEmailConfirmation()
    const emailConfirmationInterval = setInterval(() => !isEmailConfirmed && checkEmailConfirmation(), 3500)
    return () => clearInterval(emailConfirmationInterval)
  }, [isEmailConfirmed, checkEmailConfirmation, account])

  return (
    <BaseAddAccount
      relayerURL={relayerURL}
      onAddAccount={onAddAccount}
      utmTracking={utmTracking}
      pluginData={pluginData}
      isSDK={true}
      account={account}
      setAccount={setAccount}
    ></BaseAddAccount>
  )
}