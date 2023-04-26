import { Bundle } from 'adex-protocol-eth'
import { Interface, keccak256, AbiCoder } from 'ethers/lib/utils'
import accountPresets from 'ambire-common/src/constants/accountPresets'

const IDENTITY_INTERFACE = new Interface(require('adex-protocol-eth/abi/Identity5.2'))

const { quickAccManager } = accountPresets

const buildRecoveryBundle = (identity, network, signer, newValues) => {
  const abiCoder = new AbiCoder()
  const { timelock, one, two } = newValues.signer
  const newQuickAccHash = keccak256(
    abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]])
  )

  return new Bundle({
    identity,
    network,
    signer,
    txns: [
      [
        identity,
        '0x00',
        IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
          quickAccManager,
          newQuickAccHash
        ])
      ]
    ],
    recoveryMode: newValues
  })
}

export default buildRecoveryBundle
