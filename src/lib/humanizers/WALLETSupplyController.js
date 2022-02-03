import { Interface } from 'ethers/lib/utils'
import WALLETSupplyControllerABI from 'consts/WALLETSupplyControllerABI'

const iface = new Interface(WALLETSupplyControllerABI)

const toExtended = (isExtended, action) => {
  return isExtended ? [[ action ]] : [action]
}

const WALLETSupplyControllerMapping = {
  [iface.getSighash('claim')]: (txn, network, { extended = false }) => {
    return toExtended(extended, 'claim rewards')
  },
  [iface.getSighash('mintVesting')]: (txn, network, { extended = false }) => {
    return toExtended(extended, 'claim vested tokens')
  },
}
export default WALLETSupplyControllerMapping
