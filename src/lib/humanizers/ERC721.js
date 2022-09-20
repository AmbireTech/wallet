import { Interface } from 'ethers/lib/utils'
import { token, getName } from 'lib/humanReadableTransactions'

const fromText = (from, txnFrom) => from.toLowerCase() !== txnFrom.toLowerCase() ? ` from ${from}` : ''

const toExtended = (humanizerInfo, tokenId, from, to, txn, network) => [[
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
    name: getName(humanizerInfo, to)
  }
]]

const ERC721Mapping = (humanizerInfo, tokenList) => { 
  const iface = new Interface(humanizerInfo.abis.ERC721)
  return {
    [iface.getSighash('transferFrom')]: (txn, network, { extended = false }) => {
      const [ from, to, tokenId ] = iface.parseTransaction(txn).args

      // hack for erc20
      // ? in case a new network is not present in tokenList yet, so we avoid breaking the app
      const isInTokenList = tokenList[network.id]?.find(t => t.address.toLowerCase() === txn.to.toLowerCase())
      // ** 6 as USDC has low decimals for example
      if (tokenId > 10 ** 6 || isInTokenList) {
        const name = getName(humanizerInfo, to)
        if (extended) return [[
          'Send',
          {
            type: 'token',
            ...token(humanizerInfo, txn.to, tokenId, true)
          },
          'to',
          {
            type: 'address',
            address: to,
            name
          }
        ]]

        return [`Send ${token(humanizerInfo, txn.to, tokenId)} to ${to === name ? to : name+' ('+to+')'}`]
      } else {
        return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(humanizerInfo, to)}`] : toExtended(humanizerInfo, tokenId, from, to, txn, network)
      }

    },
    [iface.getSighash('safeTransferFrom(address,address,uint256)')]: (txn, network, { extended = false }) => {
      const [ from, to, tokenId ] = iface.parseTransaction(txn).args
      return !extended ? [`Send token #${tokenId.toString(10)}${fromText(from, txn.from)} to ${getName(humanizerInfo, to)}`]
      : toExtended(humanizerInfo, tokenId, from, to, txn, network)
    },
    [iface.getSighash('setApprovalForAll')]: (txn, network, { extended = false }) => {
      const [ operator, approved ] = iface.parseTransaction(txn).args
      const name = getName(humanizerInfo, operator, network)
      if (approved) {
        return extended ? [[
          `Approve`,
          { type: 'address', name, address: operator },
          `to use/spend any NFT from collection`,
          { type: 'address', name: getName(humanizerInfo, txn.to), address: txn.to }
        ]] : [`Approve ${name} to spend NFT collection ${getName(humanizerInfo, txn.to)}`]
      } else {
        return extended ? [[
          `Revoke approval for`,
          { type: 'address', name, address: operator },
          `to use/spend any NFT from collection`,
          { type: 'address', name: getName(humanizerInfo, txn.to), address: txn.to }
        ]] : [`Revoke approval for ${name} to spend NFT collection ${getName(humanizerInfo, txn.to)}`]
      }
    }
  }
}
export default ERC721Mapping
