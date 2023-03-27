import { fetchCaught } from 'lib/fetch'

export const canOpenInIframe = async (url) => {
  const res = await fetchCaught(url, { method: 'HEAD' })

  // NOTE: looks like it enough to open it in iframe
  // It fails for cors and x-frame-options
  const canBeLoaded = res?.resp?.ok

  return canBeLoaded
}
