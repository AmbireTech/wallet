import { getAddress } from 'ethers/lib/utils'
import { verifiedContracts } from '../consts/verifiedContracts'
import networks from '../consts/networks'

const getSummary = require('humanizetx/HumanizeSummary')

// @TODO custom parsing for univ2 contracts, exact output, etc.
export function getTransactionSummary(txn, networkId, accountAddr) {
  const [, value, data] = txn
  const to = getAddress(txn[0])

  const network = networks.find(x => x.id === networkId || x.chainId === networkId)
  if (!network) return 'Unknown network (unable to parse)'

  try {
    const { summaries } = getSummary(network, { to, value, data, from: accountAddr })
    // ${summaries.action ? summaries.action + ': ' : ''} ${interaction.name}:
    return `${summaries.actions.map(x => x.plain).join(', ')}`
  } catch (e) {
    console.error('parsing error', e)
    return `Unknown call`
  }
}

export function getContractName(txn, networkId) {
  const [to] = txn
  const network = networks.find(x => x.id === networkId || x.chainId === networkId)
  const contractKey = network.id + ':' + getAddress(to)
  const contractInfo = verifiedContracts[contractKey]
  return contractInfo ? contractInfo.name : null
}
