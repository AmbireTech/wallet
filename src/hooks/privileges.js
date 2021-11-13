import { useEffect, useState } from 'react'
import { fetchCaught } from '../lib/fetch'

export default function usePrivileges({ identity, network, accounts, relayerURL }) {
  const [isLoading, setLoading] = useState(true)
  const [privileges, setPrivileges] = useState({})

  const updatePrivileges = async (relayerURL, identity, network) => {
    setLoading(true)
    const requestPrivResp = await fetchCaught(`${relayerURL}/identity/${identity}/${network}/privileges`)

    if (requestPrivResp.resp.status === 200) {  
      setPrivileges(requestPrivResp.body.privileges)
    } else {
      console.log('getPrivileges error', requestPrivResp)
      // setErr(requestPrivResp.body.message ? `Relayer error: ${requestPrivResp.body.message}` : `Unknown no-message error: ${resp.status}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!relayerURL) return
    updatePrivileges(relayerURL, identity, network)
  }, [relayerURL, identity, network, accounts])

  return { privileges, isLoading }
}
