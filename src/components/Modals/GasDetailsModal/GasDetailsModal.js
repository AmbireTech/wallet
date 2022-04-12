import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import './GasDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { GAS_SPEEDS } from 'consts/gasSpeeds'

import { ACTION_GAS_COSTS, AMBIRE_OVERHEAD_COST } from 'consts/actionGasCosts'

const GasDetailsModal = ({ gasData }) => {

  const { hideModal } = useModals()
  const buttons = (<Button clear small icon={<MdClose/>} onClick={hideModal}>Close</Button>)

  const GAS_PRICES = GAS_SPEEDS.reduce((acc, speed) => {
    acc[speed] =
        gasData.gasPrice.maxPriorityFeePerGas
          ? (gasData.gasPrice.maxPriorityFeePerGas[speed] + gasData.gasPrice[speed])
          : gasData.gasPrice[speed]
    return acc
  }, {})

  return (
    <Modal id='gas-details-modal' title={'Gas information'} buttons={buttons}>
      <div className={'gas-details-date'}>
        Last updated : { new Date(gasData.gasPrice.updated).toDateString() + ' ' + new Date(gasData.gasPrice.updated).toTimeString().substr(0, 8) }
      </div>
      <div className={'gas-speed-row'}>
        {
          GAS_SPEEDS.map((speed, index) => {
            return (
              <div className={'gas-speed-block'} key={index}>
                <div className={'gas-speed-name'}>{speed}</div>
                <div className={'gas-speed-price'}>
                  {Math.round(GAS_PRICES[speed] / 10 ** 9)} Gwei
                </div>
              </div>
            )
          })
        }
      </div>
      <h4>Estimated Cost of Transaction Actions</h4>
      <table className={'gas-action-costs'}>
        <thead>
        <tr>
          <th>Action</th>
          {GAS_SPEEDS.map((speed, index) => <th key={index}>{speed}</th>)}
        </tr>
        </thead>
        <tbody>
        {
          ACTION_GAS_COSTS.map((a, index) => <tr key={index}>
            <td>{a.name}</td>
            {GAS_SPEEDS.map((speed, rowIndex) => <td key={rowIndex}>${(GAS_PRICES[speed] * (a.gas + AMBIRE_OVERHEAD_COST) / 10 ** 18 * gasData.gasFeeAssets.native).toFixed(2)}</td>)}
          </tr>)
        }
        </tbody>
      </table>
    </Modal>
  )
}

export default GasDetailsModal
