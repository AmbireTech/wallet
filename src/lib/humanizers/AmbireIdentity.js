import { Interface } from 'ethers/lib/utils'
import { getName } from 'lib/humanReadableTransactions'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import privilegesOptions from 'ambire-common/src/constants/privilegesOptions'

const iface = new Interface(require('adex-protocol-eth/abi/Identity5.2'))

const IdentityMapping = (humanizerInfo) => {
  return {
    [iface.getSighash('setAddrPrivilege')]: (txn, network) => {
      const [ addr, privLevel ] = iface.parseTransaction(txn).args
      const isQuickAccManager = addr.toLowerCase() === accountPresets.quickAccManager.toLowerCase()
      
      if (privLevel === privilegesOptions.false) {
        if (isQuickAccManager) return [['Revoke email/password access']]
        return [['Revoke access for signer', { type: 'address', address: addr, name: getName(humanizerInfo, addr) }]]
      } else if (privLevel === privilegesOptions.true) {
        if (isQuickAccManager) return ['INVALID PROCEDURE - DO NOT SIGN']
        return [['Authorize signer', { type: 'address', address: addr, name: getName(humanizerInfo, addr) }]]
      } else {
        if (isQuickAccManager) return ['Add a new email/password signer']
        return [['Set special authorization for', { type: 'address', address: addr, name: getName(humanizerInfo, addr) }]]
      }
    }
  }
}
export default IdentityMapping
