import { Interface, getAddress, hexConcat } from 'ethers/lib/utils'
import { generateAddress2 } from 'ethereumjs-util'

// the factory can be used for deploying contracts from Ambire

const FactoryMapping = () => {
  const iface = new Interface(require('adex-protocol-eth/abi/IdentityFactory'))
  return {
    [iface.getSighash('deploy')]: (txn, network) => {
      const [code, salt] = iface.parseTransaction(txn).args
      const addr = getAddress(
        `0x${generateAddress2(
          // Converting to buffer is required in ethereumjs-util version: 7.1.3
          Buffer.from(txn.to.slice(2), 'hex'),
          Buffer.from(hexConcat([salt]).slice(2), 'hex'),
          Buffer.from(code.slice(2), 'hex')
        ).toString('hex')}`
      )
      return [`Deploy contract with address ${addr}`]
    }
  }
}
export default FactoryMapping
