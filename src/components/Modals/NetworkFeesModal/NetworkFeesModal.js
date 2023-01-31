import { Modal } from 'components/common'
import { useEffect, useState } from 'react'
import { useRelayerData } from 'hooks'
import { Loading } from 'components/common'

import GasDetails from './GasDetails/GasDetails'

import styles from './NetworkFeesModal.module.scss'

const NetworkFeesModal = ({ relayerURL, selectedNetwork }) => {
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())

  useEffect(() => {
    if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL ? `${relayerURL}/gasPrice/${selectedNetwork.id}?cacheBreak=${cacheBreak}` : null
  //TODO: To implement "isLoading" and "errMsg"
  const { data, errMsg, isLoading } = useRelayerData({ url })

  const gasData = data ? data.data : null

  return (
    <Modal className={styles.wrapper} contentClassName={styles.content} title="Current network fees">
      <p className={styles.feesInfo}>
        Network fees are determined on a market principle - if more users are trying to use the network, fees are
        higher. Each network has different fees.
      </p>
      {gasData && !isLoading && <GasDetails gasData={gasData} />}
      {isLoading && <Loading />}
      {!gasData && errMsg && <h3 className={styles.error}>Gas Information: {errMsg}</h3>}
  </Modal>
  )
}

export default NetworkFeesModal
