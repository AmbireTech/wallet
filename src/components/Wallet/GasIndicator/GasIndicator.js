import './GasIndicator.scss'
import { FaGasPump } from 'react-icons/fa'
import GasDetailsModal from 'components/Modals/GasDetailsModal/GasDetailsModal'
import networks from 'consts/networks'
import { useEffect, useState } from 'react'
import { fetchGet } from 'lib/fetch'
import { useModals } from 'hooks'
import { ACTION_GAS_COSTS, AMBIRE_OVERHEAD_COST} from 'consts/actionGasCosts'

const GAS_COST_ERC20_TRANSFER = ACTION_GAS_COSTS.find(c => c.name === 'ERC20: Transfer').gas + AMBIRE_OVERHEAD_COST

const GasIndicator = ({ selectedNetwork, relayerURL }) => {

  const { showModal } = useModals()
  const [gasData, setGasData] = useState(null)

  useEffect(() => {
    let unmounted = false
    const url = `${relayerURL}/gasPrice/${selectedNetwork.id}`

    fetchGet(url).then(gasData => {
      if (unmounted) return
      setGasData(gasData.data)
    }).catch(err => {
      if (unmounted) return
      console.log('fetch error', err)
    })
    return () => unmounted = true
  }, [relayerURL, selectedNetwork])

  if (gasData) {
    return (<div className={'gas-info'}>
            <span className={'native-price'}>
                {networks.find(n => n.id === selectedNetwork.id)?.nativeAssetSymbol}: {(Number(gasData.gasFeeAssets.native)).toLocaleString('en-US', {
              minimumFractionDigits: 2
            })}
            </span>
      <span className={'gas-price'}
            onClick={() => {
              showModal(<GasDetailsModal gasData={gasData}/>)
            }
            }>
              <FaGasPump/> ${(gasData.gasPrice['medium'] * GAS_COST_ERC20_TRANSFER / 10 ** 18 * gasData.gasFeeAssets.native).toFixed(2)}
            </span>
    </div>)
  }
  return null
}

export default GasIndicator
