import { AbiCoder, Interface, keccak256 } from 'ethers/lib/utils'
import { Bundle } from 'adex-protocol-eth'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

export const accHash = signer => {
  const abiCoder = new AbiCoder()
  const { timelock, one, two } = signer
  return keccak256(abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]]))
}

export const createQuickaccPrivilegeUpdateBundle = ({ accountAddress, networkId, currentSigner, newQuickAccSigner }) => {
  return new Bundle({
    identity: accountAddress,
    network: networkId,
    signer: currentSigner,
    txns: [[
      accountAddress,
      '0x00',
      IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
        newQuickAccSigner.quickAccManager,
        accHash(newQuickAccSigner),
      ]),
    ]],
  })
}
