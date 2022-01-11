import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { getName } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.ERC721)
const fromText = (from, txnFrom) => from.toLowerCase() !== txnFrom.toLowerCase() ? ` from ${from}` : ''

const ERC721Mapping = {
  [iface.getSighash('transferFrom')]: (txn, network) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`]
  },
  [iface.getSighash('safeTransferFrom(address,address,uint256)')]: (txn, network) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`]
  }
}
export default ERC721Mapping