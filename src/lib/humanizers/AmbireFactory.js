import { Interface, getAddress, hexConcat } from 'ethers/lib/utils'
import { generateAddress2 } from 'ethereumjs-util'

// the factory can be used for deploying contracts from Ambire
const iface = new Interface(require('adex-protocol-eth/abi/IdentityFactory'))

const FactoryMapping = {
  [iface.getSighash('deploy')]: (txn, network) => {
    const [ code, salt ] = iface.parseTransaction(txn).args
    const addr = getAddress('0x' + generateAddress2(txn.to, hexConcat([salt]), code).toString('hex'))
    return [`Deploy contract with address ${addr}`]
  }
}
export default FactoryMapping
