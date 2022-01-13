import { useEffect, useCallback, useState, useRef } from 'react'
import { fetchCaught } from 'lib/fetch'

// 250ms after we've triggered a load of another URL, we will clear the data
//  so that the component that uses this hook cann display the loading spinner
const RESET_DATA_AFTER = 250

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

    // Data reset: if some time passes before we load the next piece of data, and the URL is different,
    // we will reset the data so that the UI knows to display a loading indicator
    let resetDataTimer = null
    const stripQuery = x => x.split('?')[0]
    if (stripQuery(prevUrl.current) !== stripQuery(url)) {
      resetDataTimer = setTimeout(() => setData(null), RESET_DATA_AFTER)
    }
    prevUrl.current = url

    let unloaded = false
    setLoading(true)
    setErr(null)
    updateData()
      .then(data => !unloaded && prevUrl.current === url && setData(data))
      .catch(e => !unloaded && setErr(e.message || e))
      .then(() => {
        clearTimeout(resetDataTimer)
        !unloaded && setLoading(false)
      })
    return () => {
      unloaded = true
      clearTimeout(resetDataTimer)
    }
  }, [url, updateData])

  return { data, isLoading, errMsg: err }
}
