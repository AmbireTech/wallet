import { useEffect, useState } from 'react'
import { ACTION_GAS_COSTS, AMBIRE_OVERHEAD_COST } from 'ambire-common/src/constants/actionGasCosts'

import networks from 'consts/networks'
import { fetchGet } from 'lib/fetch'

import { useModals } from 'hooks'
import NetworkFeesModal from 'components/Modals/NetworkFeesModal/NetworkFeesModal'

import { GiGasPump } from 'react-icons/gi'

import styles from './GasIndicator.module.scss'

const GAS_COST_ERC20_TRANSFER =
  ACTION_GAS_COSTS.find((c) => c.name === 'ERC20: Transfer').gas + AMBIRE_OVERHEAD_COST

const GasIndicator = ({ selectedNetwork, relayerURL, match }) => {
  const { showModal } = useModals()
  const [gasData, setGasData] = useState(null)
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())

  useEffect(() => {
    if (Date.now() - cacheBreak > 5 * 1000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  useEffect(() => {
    if (selectedNetwork.relayerlessOnly) return
    let unmounted = false
    const url = `${relayerURL}/gasPrice/${selectedNetwork.id}?cacheBreak=${cacheBreak}`

    fetchGet(url)
      .then((gasData) => {
        if (unmounted) return

        setGasData(gasData.data)
      })
      .catch((err) => {
        if (unmounted) return
        console.log('fetch error', err)
      })
    return () => (unmounted = true)
  }, [relayerURL, selectedNetwork, cacheBreak])

  const showNetworkFeesModal = () =>
    showModal(<NetworkFeesModal relayerURL={relayerURL} selectedNetwork={selectedNetwork} />)

  if (gasData) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.nativePrice}>
          {networks.find((n) => n.id === selectedNetwork.id)?.nativeAssetSymbol}:{' '}
          {Number(gasData.gasFeeAssets.native).toLocaleString('en-US', {
            minimumFractionDigits: 2
          })}
        </span>
        <button className={styles.gasPrice} onClick={showNetworkFeesModal}>
          <GiGasPump />
          <span>
            $
            {(
              (((gasData.gasPrice && gasData.gasPrice.maxPriorityFeePerGas
                ? gasData.gasPrice.maxPriorityFeePerGas.medium + gasData.gasPrice.medium
                : gasData.gasPrice.medium) *
                GAS_COST_ERC20_TRANSFER) /
                10 ** 18) *
              gasData.gasFeeAssets.native
            ).toFixed(2)}
          </span>
        </button>
      </div>
    )
  }
  return null
}

export default GasIndicator
