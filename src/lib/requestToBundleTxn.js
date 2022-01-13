import { Interface } from 'ethers/lib/utils'
import accountPresets from 'consts/accountPresets'

const IdentityFactory = new Interface(require('adex-protocol-eth/abi/IdentityFactory'))

// Pass deploySalt (eg `id('IsAmbireIdentity')`) to deploy contracts at the same address across chains
export function toBundleTxn({ to, value, data, deploySalt }, from) {
  // Transactions with no `to` are interpreted by the Ethereum network as CREATE (contract deployment) if they come from an EOA
  // however, our accounts are not EOAs, so we will just call the factory with a user-specific nonce, that's also identifiable (0x6942)
  if (to === '0x' || !to) {
    const salt = deploySalt || `0x69420000000000${Date.now().toString(16).slice(1,9)}00${from.slice(2)}`
    return [accountPresets.identityFactoryAddr, value, IdentityFactory.encodeFunctionData('deploy', [data, salt])]
  }
  return [to, value || '0x0', data || '0x']
}