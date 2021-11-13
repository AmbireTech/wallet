import { useEffect, useCallback, useState } from 'react'
import { fetchCaught } from '../lib/fetch'

export default function usePrivileges({ identity, network, relayerURL }) {
  const [isLoading, setLoading] = useState(true)
  const [privileges, setPrivileges] = useState({})
  const [err, setErr] = useState(null)

  const updatePrivileges = useCallback(async () => {
    const requestPrivResp = await fetchCaught(`${relayerURL}/identity/${identity}/${network}/privileges`)

    if (requestPrivResp.resp.status === 200) {  
      return requestPrivResp.body.privileges
    } else {
      console.log('getPrivileges error', requestPrivResp)
      throw new Error(requestPrivResp.errMsg || `status code ${requestPrivResp.resp.status}`)
    }
  }, [relayerURL, identity, network])

  useEffect(() => {
    let unloaded = false
    setLoading(true)
    setErr(null)
    updatePrivileges()
      .then(privileges => !unloaded && setPrivileges(privileges))
      .catch(e => !unloaded && setErr(`Error getting authorized signers: ${e.message || e}`))
      .then(() => !unloaded && setLoading(false))
    return () => unloaded = true
  }, [updatePrivileges])

  return { privileges, isLoading, errMsg: err }
}
