import { abis } from '../../consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { getContractName } from '../humanReadableTransactions'

const iface = new Interface(abis.ERC721)
const fromText = (from, txnFrom) => from.toLowerCase() !== txnFrom.toLowerCase() ? ` from ${from}` : ''

export default {
  [iface.getSighash('transferFrom')]: (txn, network) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getContractName(to, network)}`]
  },
  [iface.getSighash('safeTransferFrom(address,address,uint256)')]: (txn, network) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getContractName(to, network)}`]
  },
  /*
  // HACK: since this conflicts with ERC721 in terms of sigHash, but ERC721 is more likely to use this function, do not define this one
  [iface.getSighash('transferFrom')]: (txn, network) => {
    const [ from, to, amount ] = iface.parseTransaction(txn).args
    return [`Send ${token(txn.to, amount)} from ${getContractName(from, network)} to ${getContractName(to, network)}`]
  },*/
}
