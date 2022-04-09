import './GasIndicator.scss'
import { FaGasPump } from 'react-icons/fa'
import GasDetailsModal from 'components/Modals/GasDetailsModal/GasDetailsModal'
import networks from 'consts/networks'
import { useEffect, useState } from 'react'
import { fetchGet } from 'lib/fetch'
import { useModals } from 'hooks'

const GasIndicator = ({ selectedNetwork, relayerURL }) => {

  const { showModal } = useModals()
  const [gasData, setGasData] = useState(null)

  useEffect(() => {
    const url = `${relayerURL}/gasPrice/${selectedNetwork.id}`

    fetchGet(url).then(gasData => {
      setGasData(gasData.data)
    }).catch(err => {
      console.log('fetch error', err)
    })
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
              <FaGasPump/> {Math.round(gasData.gasPrice['medium'] / 10 ** 9)} Gwei
            </span>
    </div>)
  }
  return null
}

export default GasIndicator
