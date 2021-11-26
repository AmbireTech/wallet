import { useEffect, useCallback, useState, useRef } from 'react'
import { fetchCaught } from '../lib/fetch'

export default function useRelayerData(url) {
  const [isLoading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const prevUrl = useRef('')

  const updateData = useCallback(async () => {
    const { resp, body, errMsg } = await fetchCaught(url)

    if (resp && resp.status === 200) {
      return body
    } else {
      console.log('relayerData error', { resp, body, errMsg })
      throw new Error(errMsg || `status code ${resp && resp.status}`)
    }
  }, [url])

  useEffect(() => {
    if (!url) return

    const stripQuery = x => x.split('?')[0]
    if (stripQuery(prevUrl.current) !== stripQuery(url)) setData(null)
    prevUrl.current = url

    let unloaded = false
    setLoading(true)
    setErr(null)
    updateData()
      .then(data => !unloaded && setData(data))
      .catch(e => !unloaded && setErr(e.message || e))
      .then(() => !unloaded && setLoading(false))
    return () => unloaded = true
  }, [url, updateData])

  return { data, isLoading, errMsg: err }
}
