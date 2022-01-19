import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'
import { constants } from 'ethers'

const iface = new Interface(abis.ERC20)

const ERC20Mapping = {
  [iface.getSighash('approve')]: (txn, network, { extended = false }) => {
    const [ approvedAddress, amount ] = iface.parseTransaction(txn).args
    const name = getName(approvedAddress, network)
    const tokenName = getName(txn.to, network)
    if (amount.eq(0)) return !extended ? [`Revoke approval for ${name} to use ${tokenName}`] : [[
      'Revoke',
      'approval for',
      {
        type: 'address',
        address: approvedAddress,
        name
      },
      'to use',
      {
        type: 'token',
        ...token(txn.to, amount, true)
      }
    ]]

    if (extended) return [[
      'Approve',
      {
        type: 'address',
        address: approvedAddress,
        name
      },
      `to use${amount.eq(constants.MaxUint256) ? ' your' : ''}`,
      {
        type: 'token',
        ...token(txn.to, amount, true)
      }
    ]]

    if (amount.eq(constants.MaxUint256)) return [`Approve ${name} to use your ${tokenName}`]
    return [`Approve ${name} to use ${token(txn.to, amount)}`]
  },
  [iface.getSighash('transfer')]: (txn, network, { extended }) => {
    const [ to, amount ] = iface.parseTransaction(txn).args
    const name = getName(to, network)
    
    if (extended) return [[
      'Send',
      {
        type: 'token',
        ...token(txn.to, amount, true)
      },
      'to',
      {
        type: 'address',
        address: to,
        name
      }
    ]]
  
    return [`Send ${token(txn.to, amount)} to ${to === name ? to : name+' ('+to+')'}`]
  },
  /*
  // HACK: since this conflicts with ERC721 in terms of sigHash, but ERC721 is more likely to use this function from a user perspective, do not define this one
  [iface.getSighash('transferFrom')]: (txn, network) => {
    const [ from, to, amount ] = iface.parseTransaction(txn).args
    return [`Send ${token(txn.to, amount)} from ${getName(from, network)} to ${getName(to, network)}`]
  },*/
}
export default ERC20Mapping
