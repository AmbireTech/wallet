const ethUtil = require('ethereumjs-util')

// For existing accounts that will not have signerExtra.derivationPath in localStorage
export const DEFAULT_DERIVATION_PATH = "44'/60'/0'/0/0" // Child

export function addressOfHDKey(hdKey) {
  const shouldSanitizePublicKey = true
  const derivedPublicKey = hdKey.publicKey
  const ethereumAddressUnprefixed = ethUtil
    .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
    .toString('hex')
  return ethUtil.addHexPrefix(ethereumAddressUnprefixed).toLowerCase()
}

