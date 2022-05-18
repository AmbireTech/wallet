import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers } from 'ethers'
import HDNode from 'hdkey'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerSignMessage, ledgerSignTransaction, ledgerSignMessage712, ledgerGetAddresses } from './ledgerWebHID'
import { latticeInit, latticeConnect, latticeSignMessage, latticeSignTransaction } from 'lib/lattice'
import { _TypedDataEncoder } from 'ethers/lib/utils'
import { getProvider } from 'lib/provider'
import networks from 'consts/networks'

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
      signTransaction: params => providerTrezor.signTransactionAsync({ ...params, from: signer.address }),
      sendTransaction: async (transaction) => {
        throw Error('sendTransaction not implemented yet for Trezor')
      },
      isConnected: async () => null // TODO: implement
    }
  } else if (signerExtra && signerExtra.type === 'ledger') {
    if (signerExtra.transportProtocol === 'webHID') {
      return {
        signMessage: hash => ledgerSignMessage(ethers.utils.hexlify(hash), signer.address),
        signTransaction: params => ledgerSignTransaction(params, chainId),
        sendTransaction: async (transaction) => {
          const network = networks.find(n => n.chainId === transaction.chainId)
          if (!network) throw Error('no network found for chainId : ' + transaction.chainId)
          const provider = await getProvider(network.id)
          if (!provider) throw Error('no provider found for network : ' + network.id)

          transaction.nonce = ethers.utils.hexlify(await provider.getTransactionCount(transaction.from))

          const signedTx = await ledgerSignTransaction(transaction, transaction.chainId)

          return provider.sendTransaction(signedTx)
        },
        isConnected: async (matchAddress) => { // chain is provided to ledger. Not necessary to check network
          const addresses = await ledgerGetAddresses()

          if (addresses && addresses.addresses && addresses.addresses[0]) {
            if (matchAddress) {
              return !!addresses.addresses.find(a => a.toLowerCase() === matchAddress.toLowerCase())
            }
            return true
          }

          return false
        },
        _signTypedData: (domain, types, value) => {
          const domainSeparator = _TypedDataEncoder.hashDomain(domain)
          const hashStructMessage = _TypedDataEncoder.hashStruct(_TypedDataEncoder.getPrimaryType(types), types, value)
          return ledgerSignMessage712(domainSeparator, hashStructMessage, signer.address)
        }
      }
    } else {
      const provider = new LedgerSubprovider({
        networkId: chainId,
        ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        baseDerivationPath: signerExtra.info.baseDerivationPath
      })
      return {
        signMessage: hash => provider.signPersonalMessageAsync(ethers.utils.hexlify(hash), signer.address),
        signTransaction: params => provider.signTransactionAsync({ ...params, from: signer.address }),
        sendTransaction: async () => {
          throw Error('Please use a chrome based browser to use Ledger')
        },
        isConnected: async (matchAddress) => { // chain is provided to ledger. Not necessary to check network
          const addresses = await provider.getAccountsAsync(1)

          if (addresses && addresses.length) {
            if (matchAddress) {
              return !!addresses.find(a => a.toLowerCase() === matchAddress.toLowerCase())
            }
            return true
          }

          return false
        },
        _signTypedData: (domain, types, value) => {
          throw Error('Please, use a chrome based browser to use 721 Typed signatures')
        }
      }
    }
  } else if (signerExtra && signerExtra.type === 'Lattice') {
    return {
      signMessage: async hash => {
        try {
          const { commKey, deviceId } = signerExtra
          const client = latticeInit(commKey)
          const {isPaired, errConnect } = await latticeConnect(client, deviceId)

          if (errConnect) throw new Error(errConnect.message || errConnect)

          if (!isPaired) {
            // Canceling the visualization of the secret code on the device's screen.
            client.pair('')
            throw new Error('The Lattice device is not paired! Please re-add your account!')
          }

          const { signedMsg, errSignMessage } = await latticeSignMessage(client, hash)
          if (errSignMessage) throw new Error(errSignMessage)

          return signedMsg
        } catch(e) {
          console.log(e)
          throw new Error(`Lattice: ${e}`)
        }
      },
      signTransaction: async params => {
        try {
          const { commKey, deviceId } = signerExtra
          const client = latticeInit(commKey)
          const {isPaired, errConnect } = await latticeConnect(client, deviceId)

          if (errConnect) throw new Error(errConnect.message || errConnect)

          if (!isPaired) {
            // Canceling the visualization of the secret code on the device's screen.
            client.pair('')
            throw new Error('The Lattice device is not paired! Please re-add your account!')
          }

          const { serializedSigned, errSignTxn } = await latticeSignTransaction(client, params, chainId)
          if (errSignTxn) throw new Error(errSignTxn)

          return serializedSigned
        } catch(e) {
          console.log(e)
          throw new Error(`Lattice: ${e}`)
        }
      },
      sendTransaction: async (transaction) => {
        throw Error('sendTransaction not implemented yet for Lattice')
      },
      isConnected: async () => null // TODO: implement (graceful fail for now)
    }
  } else if (signer.address) {
    if (!window.ethereum) throw new Error('No web3 support detected in your browser: if you created this account through MetaMask, please install it.')
    // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
    // 'any' is explained here: https://github.com/ethers-io/ethers.js/issues/1107
    const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')

    const signerObject = provider.getSigner(signer.address)

    signerObject.isConnected = async (matchAddress, matchChain) => {
      const accounts = await provider.listAccounts()

      let match = true
      if (!!(accounts.length)) {
        if (matchAddress) {
          match = !!accounts.find(a => a.toLowerCase() === matchAddress.toLowerCase())
        }
        if (matchChain) {
          const { chainId } = await provider.getNetwork()
          match = match && chainId === matchChain
        }
      } else {
        match = false
      }
      return match
    }

    return signerObject
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
