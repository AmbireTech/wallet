import { Interface } from 'ethers/lib/utils'
import WALLETSupplyControllerABI from 'ambire-common/src/constants/abis/WALLETSupplyControllerABI.json'

const iface = new Interface(WALLETSupplyControllerABI)

const toExtended = (isExtended, action, details = '') => {
  return isExtended ? [[ action, details ]] : [action, details]
}

const WALLETSupplyControllerMapping = {
  [iface.getSighash('claim')]: (txn, network, { extended = false }) => {
    const { toBurnBps } = iface.parseTransaction(txn).args
    const burnPercentage = toBurnBps.toString() / 100
    return toExtended(extended, 'claim rewards', burnPercentage > 0 ? `with ${burnPercentage}% burn` : '')
  },
  [iface.getSighash('mintVesting')]: (txn, network, { extended = false }) => {
    return toExtended(extended, 'claim vested tokens')
  },
}
export default WALLETSupplyControllerMapping
