import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { getName } from 'lib/humanReadableTransactions'

const iface = new Interface(abis.ERC721)
const fromText = (from, txnFrom) => from.toLowerCase() !== txnFrom.toLowerCase() ? ` from ${from}` : ''

const toExtended = (tokenId, from, to, txn, network) => [[
  'Send',
  {
    type: 'erc721',
    address: txn.to,
    network: network.id,
    id: tokenId,
    name: `Token #${tokenId.toString(10)}${fromText(from, txn.from)}`,
  },
  'to',
  {
    type: 'address',
    address: to,
    name: getName(to, network)
  }
]]

const ERC721Mapping = {
  [iface.getSighash('transferFrom')]: (txn, network, { extended = false }) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`]
    : toExtended(tokenId, from, to, txn, network)
  },
  [iface.getSighash('safeTransferFrom(address,address,uint256)')]: (txn, network, { extended = false }) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`]
    : toExtended(tokenId, from, to, txn, network)
  }
}
export default ERC721Mapping