import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers } from 'ethers'
import HDNode from 'hdkey'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerSignMessage, ledgerSignTransaction } from './ledgerWebHID'

let wallets = {}

// opts
// passphrase: string
// noCache: boolean
export function getWallet({ signer, signerExtra, chainId }, opts = {}) {
  const id = `${signer.address || signer.one}${chainId}`
  if (wallets[id]) return wallets[id]
  return wallets[id] = getWalletNew({ signer, signerExtra, chainId }, opts)
}

function getWalletNew({ chainId, signer, signerExtra }, opts) {
  if (signerExtra && signerExtra.type === 'trezor') {
    const providerTrezor = new TrezorSubprovider({
      trezorConnectClientApi: TrezorConnect,
      networkId: chainId
    })
    providerTrezor._initialDerivedKeyInfo = getInitialDerivedKeyInfo(signerExtra)
    // for Trezor/ledger, alternatively we can shim using https://www.npmjs.com/package/web3-provider-engine and then wrap in Web3Provider
    return {
      signMessage: hash => providerTrezor.signPersonalMessageAsync(ethers.utils.hexlify(hash), signer.address),
      signTransaction: params => providerTrezor.signTransactionAsync({ ...params, from: signer.address })
    }
  } else if (signerExtra && signerExtra.type === 'ledger') {
    if (signerExtra.transportProtocol === 'webHID') {
      return {
        signMessage: hash => ledgerSignMessage(ethers.utils.hexlify(hash), signer.address),
        signTransaction: params => ledgerSignTransaction(params, chainId)
      }
    } else {
      const provider = new LedgerSubprovider({
        networkId: chainId,
        ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        baseDerivationPath: signerExtra.info.baseDerivationPath
      })
      return {
        signMessage: hash => provider.signPersonalMessageAsync(ethers.utils.hexlify(hash), signer.address),
        signTransaction: params => provider.signTransactionAsync({ ...params, from: signer.address })
      }
    }
  } else if (signer.address) {
    if (!window.ethereum) throw new Error('No web3 support detected in your browser: if you created this account through MetaMask, please install it.')
    // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
    // 'any' is explained here: https://github.com/ethers-io/ethers.js/issues/1107
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
    return provider.getSigner(signer.address)
  } else if (signer.one) {
    throw new Error('getWallet not applicable for QuickAccounts: use primaryKeyBackup with the passphrase and /second-sig')
  } else {
    throw new Error('unknown signer type')
  }
}

function getInitialDerivedKeyInfo(signerExtra) {
  return {
    hdKey: HDNode.fromExtendedKey(signerExtra.info.hdKey.xpub),
    derivationPath: signerExtra.info.derivationPath,
    baseDerivationPath: signerExtra.info.baseDerivationPath
  }
}
