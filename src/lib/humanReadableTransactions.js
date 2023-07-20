import { formatUnits } from 'ethers/lib/utils'
import { constants } from 'ethers'
import networks from 'consts/networks'
import humanizers from './humanizers'

// address (lowercase) => name
let knownAliases = {}
// address (lowercase) => [symbol, decimals]
const knownTokens = {}
// address (lowercase) => name
const knownAddressNames = {}

export const formatNativeTokenAddress = (address) =>
  address.toLowerCase() === `0x${'e'.repeat(40)}` ? `0x${'0'.repeat(40)}` : address.toLowerCase()

export function getTransactionSummary(
  humanizerInfo,
  tokenList,
  txn,
  networkId,
  accountAddr,
  opts = {}
) {
  const { tokens, names } = humanizerInfo
  const [to, value, data = '0x'] = txn
  const network = networks.find((x) => x.id === networkId || x.chainId === networkId)
  if (!network) return 'Unknown network (unable to parse)'

  if (to === '0x' || !to) {
    return 'Deploy contract'
  }

  const tokenInfo = tokens[to.toLowerCase()]
  const name = names[to.toLowerCase()]

  if (data === '0x' && to.toLowerCase() === accountAddr.toLowerCase()) {
    // Doesn't matter what the value is, this is always a no-op
    return !opts.extended ? 'Transaction cancellation' : [['Cancel', 'transaction']]
  }

  let callSummary
  let sendSummary
  if (parseInt(value) > 0)
    sendSummary = !opts.extended
      ? `send ${nativeToken(network, value)} to ${name || to}`
      : [
          'Send',
          {
            type: 'token',
            ...nativeToken(network, value, true)
          },
          'to',
          {
            type: 'address',
            address: to,
            name: getName(humanizerInfo, to)
          }
        ]

  if (data !== '0x') {
    callSummary = !opts.extended
      ? `Unknown interaction with ${name || (tokenInfo ? tokenInfo[0] : to)}`
      : [
          'Unknown',
          'interaction with',
          {
            type: 'address',
            address: to,
            name: name || (tokenInfo && tokenInfo[0])
          }
        ]

    const sigHash = data.slice(0, 10)
    // NOTE: If case of duplicate sigHashes of different contracts we concat the sigHash and the txn.to address
    const sigHashWithAddress = Object.keys(humanizers({ humanizerInfo, tokenList }))
      .filter((sig) => sig.length > 10)
      .find((item) => item === `${sigHash}:${to}`)

    const humanizer = !!sigHashWithAddress
      ? humanizers({ humanizerInfo, tokenList })[sigHashWithAddress]
      : humanizers({ humanizerInfo, tokenList })[sigHash]

    if (humanizer) {
      try {
        const actions = humanizer({ to, value, data, from: accountAddr }, network, opts)
        return opts.extended === true ? actions : actions.join(', ')
      } catch (e) {
        callSummary = opts.extended
          ? callSummary.concat(['(unable to parse)'])
          : `${callSummary} (unable to parse)`
        console.error('internal tx humanization error', e)
      }
    }
  }

  const filteredSummary = [callSummary, sendSummary].filter((x) => x)
  return !opts.extended ? filteredSummary.join(', ') : filteredSummary
}

// Currently takes network because one day we may be seeing the same addresses used on different networks
export function getName(humanizerInfo, addr) {
  const { tokens, names } = humanizerInfo
  const address = addr.toLowerCase()
  return (
    names[address] ||
    (tokens[address] ? `${tokens[address][0]} token` : null) ||
    knownAliases[address] ||
    knownAddressNames[address] ||
    addr
  )
}

export function token(humanizerInfo, addr, amount, extended = false) {
  const { tokens } = humanizerInfo
  const address = addr.toLowerCase()
  const assetInfo = tokens[address] || knownTokens[address]

  if (assetInfo) {
    const extendedToken = {
      address,
      symbol: assetInfo[0],
      decimals: assetInfo[1],
      amount: null
    }

    if (!amount) return !extended ? assetInfo[0] : extendedToken

    if (constants.MaxUint256.eq(amount))
      return !extended
        ? `maximum ${assetInfo[0]}`
        : {
            ...extendedToken,
            amount: -1
          }

    return !extended
      ? `${formatUnits(amount, assetInfo[1])} ${assetInfo[0]}`
      : {
          ...extendedToken,
          amount: formatUnits(amount, assetInfo[1])
        }
  }
  return !extended
    ? ` ${!amount ? 'unknown' : formatUnits(amount, 0)} units of unknown token`
    : {
        address,
        symbol: null,
        decimals: null,
        amount: !amount ? null : formatUnits(amount, 0)
      }
}

export function nativeToken(network, amount, extended = false) {
  const extendedNativeToken = {
    address: `0x${'0'.repeat(40)}`,
    symbol: 'unknown native token',
    decimals: 18
  }

  // All EVM chains use a 18 decimal native asset
  if (network) {
    return !extended
      ? `${formatUnits(amount, 18)} ${network.nativeAssetSymbol}`
      : {
          ...extendedNativeToken,
          symbol: network.nativeAssetSymbol,
          amount: formatUnits(amount, 18)
        }
  }
  return !extended
    ? `${formatUnits(amount, 18)} unknown native token`
    : {
        ...extendedNativeToken,
        amount: formatUnits(amount, 18)
      }
}

export function setKnownAddressNames(uDomains) {
  uDomains.forEach(
    ({ address, addressLabel }) => (knownAddressNames[address.toLowerCase()] = addressLabel)
  )
}

export function setKnownAddresses(addrs) {
  const latestKnownAddresses = {}
  addrs.forEach(({ address, name }) => (latestKnownAddresses[address.toLowerCase()] = name))
  knownAliases = latestKnownAddresses
}

export function setKnownTokens(tokens) {
  tokens.forEach(
    ({ address, symbol, decimals }) => (knownTokens[address.toLowerCase()] = [symbol, decimals])
  )
}

export function isKnown(humanizerInfo, txn, from) {
  const { tokens, names } = humanizerInfo
  if (txn[0] === from) return true
  const address = txn[0].toLowerCase()
  return !!(knownAliases[address] || names[address] || tokens[address] || knownTokens[address])
}

export { knownAliases, knownTokens }

// @TODO
// export function getMethodName(txn)
