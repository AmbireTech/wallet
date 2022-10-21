import './GasIndicator.scss'
import { GiGasPump } from 'react-icons/gi'
import networks from 'consts/networks'
import { useEffect, useState } from 'react'
import { fetchGet } from 'lib/fetch'
import { ACTION_GAS_COSTS, AMBIRE_OVERHEAD_COST} from 'ambire-common/src/constants/actionGasCosts'
import { Link } from 'react-router-dom'

const GAS_COST_ERC20_TRANSFER = ACTION_GAS_COSTS.find(c => c.name === 'ERC20: Transfer').gas + AMBIRE_OVERHEAD_COST

const GasIndicator = ({ selectedNetwork, relayerURL, match }) => {
  const [gasData, setGasData] = useState(null)
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())

  useEffect(() => {
    if ((Date.now() - cacheBreak) > 5 * 1000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 60 * 1000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  useEffect(() => {
    if (selectedNetwork.relayerlessOnly) return 
    let unmounted = false
    const url = `${relayerURL}/gasPrice/${selectedNetwork.id}?cacheBreak=${cacheBreak}`

    fetchGet(url).then(gasData => {
      if (unmounted) return

      setGasData(gasData.data)
    }).catch(err => {
      if (unmounted) return
      console.log('fetch error', err)
    })
    return () => unmounted = true
  }, [relayerURL, selectedNetwork, cacheBreak])

  if (gasData) {
    return (<div className={'gas-info'}>
            <span className={'native-price'}>
                {networks.find(n => n.id === selectedNetwork.id)?.nativeAssetSymbol}: {(Number(gasData.gasFeeAssets.native)).toLocaleString('en-US', {
              minimumFractionDigits: 2
            })}
            </span>
            <Link to={match.url + "/gas-tank"}>
              <span className={'gas-price'}>
                <GiGasPump/> ${((gasData.gasPrice && gasData.gasPrice.maxPriorityFeePerGas ? (gasData.gasPrice.maxPriorityFeePerGas['medium'] + gasData.gasPrice['medium']) : gasData.gasPrice['medium']) * GAS_COST_ERC20_TRANSFER / 10 ** 18 * gasData.gasFeeAssets.native).toFixed(2)}
              </span>
            </Link>
    </div>)
  }
  return null
}

export default GasIndicator
