import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { Interface } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import accountPresets from 'ambire-common/src/constants/accountPresets'

const ERC20AbiInterface = new Interface(ERC20ABI)
const TRANSFER_SIGHASH = ERC20AbiInterface.getSighash(
  ERC20AbiInterface.getFunction('transfer').format()
)
const feeCollector = accountPresets.feeCollector
const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

function getTxnTransferInfo(txn) {
  try {
    const res = ERC20AbiInterface.decodeFunctionData('transfer', txn)

    return {
      value: BigNumber.from(res._value),
      ...res
    }
  } catch (e) {
    console.error(e)
    return {}
  }
}

function isFeeCollectorTxn(txn) {
  // is first call is to relayer this is native
  if (txn[0] === feeCollector) return true
  // transfer token to relayer
  if (txn[2].startsWith(TRANSFER_SIGHASH) && getTxnTransferInfo(txn[2])._to === feeCollector)
    return true
  return false
}

const getGasTankFilledTxns = (transactions) => {
  const depositTxns = []
  transactions.forEach(({ txId, txns, submittedAt, gasTankFee, identity, ...rest }) => {
    const filteredTxns = txns
      .filter((txnCall, i) => isFeeCollectorTxn(txnCall) && (gasTankFee || i < txns.length - 1))
      .map((fillTxn) => {
        if (fillTxn[0] === feeCollector) {
          return {
            submittedAt,
            address: NATIVE_ADDRESS,
            value: BigNumber.from(fillTxn[1]),
            identity,
            txId,
            ...rest
          }
        }
        if (
          fillTxn[2].startsWith(TRANSFER_SIGHASH) &&
          ERC20AbiInterface.decodeFunctionData('transfer', fillTxn[2])._to === feeCollector
        ) {
          return {
            submittedAt,
            address: fillTxn[0],
            value: BigNumber.from(
              ERC20AbiInterface.decodeFunctionData('transfer', fillTxn[2])._value
            ),
            identity,
            txId,
            ...rest
          }
        }
        return null
      })

    if (filteredTxns.length) depositTxns.push(filteredTxns[0])
  })

  return depositTxns
}

export { getGasTankFilledTxns }
