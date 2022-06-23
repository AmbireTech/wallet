import { abis } from 'consts/humanizerInfo'
import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'
import TokenList from 'consts/tokenList'

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

    // hack for erc20
    // ? in case a new network is not present in TokenList yet, so we avoid breaking the app
    const isInTokenList = TokenList[network.id]?.find(t => t.address.toLowerCase() === txn.to.toLowerCase())
    // ** 6 as USDC has low decimals for example
    if (tokenId > 10 ** 6 || isInTokenList) {
      const name = getName(to, network)
      if (extended) return [[
        'Send',
        {
          type: 'token',
          ...token(txn.to, tokenId, true)
        },
        'to',
        {
          type: 'address',
          address: to,
          name
        }
      ]]

      return [`Send ${token(txn.to, tokenId)} to ${to === name ? to : name+' ('+to+')'}`]
    } else {
      return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`] : toExtended(tokenId, from, to, txn, network)
    }

  },
  [iface.getSighash('safeTransferFrom(address,address,uint256)')]: (txn, network, { extended = false }) => {
    const [ from, to, tokenId ] = iface.parseTransaction(txn).args
    return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(to, network)}`]
    : toExtended(tokenId, from, to, txn, network)
  },
  [iface.getSighash('setApprovalForAll')]: (txn, network, { extended = false }) => {
    const [ operator, approved ] = iface.parseTransaction(txn).args
    const name = getName(operator, network)
    if (approved) {
      return extended ? [[
        `Approve`,
        { type: 'address', name, address: operator },
        `to use/spend any NFT from collection`,
        { type: 'address', name: getName(txn.to), address: txn.to }
      ]] : [`Approve ${name} to spend NFT collection ${getName(txn.to)}`]
    } else {
      return extended ? [[
        `Revoke approval for`,
        { type: 'address', name, address: operator },
        `to use/spend any NFT from collection`,
        { type: 'address', name: getName(txn.to), address: txn.to }
      ]] : [`Revoke approval for ${name} to spend NFT collection ${getName(txn.to)}`]
    }
  }
}
export default ERC721Mapping
