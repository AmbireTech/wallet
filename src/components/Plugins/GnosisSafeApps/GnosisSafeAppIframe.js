import './GnosisSafeApps.scss'

import { useEffect, useRef, useState } from 'react'
import { Skeleton, AmbireLoading } from 'components/common'

export default function GnosisSafeAppIframe({
  selectedApp = {},
  title = 'Ambire Plugin',
  network,
  selectedAcc,
  gnosisConnect,
  gnosisDisconnect,
  className
}) {
  const { chainId } = network || {}
  let { url } = selectedApp || {}
  url = url.replace('${accountAddress}',selectedAcc).replace('${chainId}', network.chainId)
  const [loading, setLoading] = useState(true)
  const [hash, setHash] = useState('')
  const [overlayVisible, setOverlayVisible] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    const newHash = url + chainId + selectedAcc
    setHash(newHash)
  }, [chainId, selectedAcc, url])

  useEffect(() => {
    setLoading(true)
  }, [hash])

  useEffect(() => {
    gnosisConnect({
      selectedAcc,
      iframeRef,
      app: selectedApp
    })

    return () => {
      gnosisDisconnect()
    }
  }, [selectedApp, network, selectedAcc, iframeRef, gnosisConnect, gnosisDisconnect])

  useEffect(() => {
    document.addEventListener('show-overlay', (e) => {
      setOverlayVisible(e.detail)
    })

    return () => {
      document.removeEventListener('show-overlay', (e) => {
        setOverlayVisible(e.detail)
      })
    }
  }, [])

  return (
    <div id="plugin-gnosis-container" className={className}>
      {loading && (
        <div className="iframe-placeholder">
          <Skeleton>
            <AmbireLoading />
          </Skeleton>
        </div>
      )}

      {url && (
        <iframe
          id={hash}
          key={hash}
          ref={iframeRef}
          title={title}
          src={url}
          onLoad={() => {
            setLoading(!(iframeRef?.current?.contentDocument || iframeRef.current.contentWindow))
          }}
          style={loading ? { display: 'none' } : {}}
          allow="clipboard-read; clipboard-write"
        />
      )}
      {overlayVisible && <div className="iframe-overlay" />}
    </div>
  )
}
