import { Interface } from 'ethers/lib/utils'
import accountPresets from '../consts/accountPresets'

const IdentityFactory = new Interface(require('adex-protocol-eth/abi/IdentityFactory'))

export function toBundleTxn({ to, value, data }, from) {
  if (to === '0x' || !to) {
    const salt = `0x624200000000000000000000${from.slice(2)}`
    console.log(salt)
    return [accountPresets.identityFactoryAddr, value, IdentityFactory.encodeFunctionData('deploy', [data, salt])]
  }
  return [to, value || '0x0', data || '0x']
}