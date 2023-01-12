import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { useLocalStorage } from 'hooks'

export default function Logout() {
  const location = useLocation()

  const [alreadyLoggedOut, setAlreadyLoggedOut] = useState(false)
  const [stateStorage, setStateStorage] = useLocalStorage({
    key: 'login_sdk',
    defaultValue: {connected_dapps: []}
  })

  const dappOrigin = new URLSearchParams(location.search).get("dappOrigin")

  const matchedDapp = stateStorage.connected_dapps.find(dapp => dapp.origin === dappOrigin)

  useEffect(() => {
    if (alreadyLoggedOut || !dappOrigin || !matchedDapp || !matchedDapp.wallet_address) return

    // leave all except this dapp from the local storage state
    setStateStorage({connected_dapps: stateStorage.connected_dapps.filter(dapp => dapp.origin !== dappOrigin)})

    window.parent.postMessage({
      type: 'logoutSuccess',
    }, '*')

    setAlreadyLoggedOut(true)
  }, [stateStorage.connected_dapps, setStateStorage, alreadyLoggedOut, dappOrigin, matchedDapp])

  return (
    <div>Logging out...</div>
  )
}