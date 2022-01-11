import { Interface } from 'ethers/lib/utils'
import { getName } from 'lib/humanReadableTransactions'
import accountPresets from 'consts/accountPresets'
import privilegesOptions from 'consts/privilegesOptions'

const iface = new Interface(require('adex-protocol-eth/abi/Identity5.2'))

const IdentityMapping = {
  [iface.getSighash('setAddrPrivilege')]: (txn, network) => {
    const [ addr, privLevel ] = iface.parseTransaction(txn).args
    const name = getName(addr, network)
    const isQuickAccManager = addr.toLowerCase() === accountPresets.quickAccManager.toLowerCase()
    if (privLevel === privilegesOptions.false) {
      if (isQuickAccManager) return [`Revoke email/password access`]
      else return [`Revoke access for signer ${name}`]
    } else if (privLevel === privilegesOptions.true) {
      if (isQuickAccManager) return [`INVALID PROCEDURE - DO NOT SIGN`]
      return [`Authorize signer ${name}`]
    } else {
      if (isQuickAccManager) return [`Add a new email/password signer`]
      return [`Set special authorization for ${name}`]
    }
  }
}
export default IdentityMapping
