import { Interface } from 'ethers/lib/utils'
import WALLETSupplyControllerABI from 'ambire-common/src/constants/abis/WALLETSupplyControllerABI.json'

const toExtended = (isExtended, action, details = '') => {
  return isExtended ? [[action, details]] : [action, details]
}

const WALLETSupplyControllerMapping = () => {
  const iface = new Interface(WALLETSupplyControllerABI)

  return {
    [iface.getSighash('claim')]: (txn, network, { extended = false }) => {
      const { toBurnBps } = iface.parseTransaction(txn).args
      const burnPercentage = toBurnBps.toString() / 100
      return toExtended(
        extended,
        'Claim rewards',
        burnPercentage > 0 ? `with ${burnPercentage}% burn` : ''
      )
    },
    [iface.getSighash('claimWithRootUpdate')]: (txn, network, { extended = false }) => {
      const { toBurnBps } = iface.parseTransaction(txn).args
      const burnPercentage = toBurnBps.toString() / 100
      return toExtended(
        extended,
        'Claim rewards',
        burnPercentage > 0 ? `with ${burnPercentage}% burn` : ''
      )
    },
    [iface.getSighash('mintVesting')]: (txn, network, { extended = false }) => {
      return toExtended(extended, 'Claim vested tokens')
    }
  }
}
export default WALLETSupplyControllerMapping
