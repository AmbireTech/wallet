import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers } from 'ethers'
import HDNode from 'hdkey'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerSignMessage, ledgerSignTransaction } from './ledgerWebHID'
import { Client } from 'gridplus-sdk'

const crypto = require('crypto')
const privKey = 'ef903967c21ec517d2df66eae824856f6dd8c99694bd2d8ee9fc85e329a51341'
const HARDENED_OFFSET = 0x80000000
const clientConfig = {
  name: 'Ambire Wallet',
  crypto: crypto,
  privKey: privKey,
}

const client = new Client(clientConfig)

let wallets = {}

// opts
// passphrase: string
// noCache: boolean
export function getWallet({ signer, signerExtra, chainId }, opts = {}) {
  const id = `${signer.address || signer.one}${chainId}`
  if (wallets[id]) return wallets[id]
  return wallets[id] = getWalletNew({ signer, signerExtra, chainId }, opts)
}

async function getWalletNew({ chainId, signer, signerExtra }, opts) {
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
  } else if (signerExtra && signerExtra.type === 'Lattice') {
    // const data = {
    //   nonce: '0x01',
    //   gasLimit: '0x61a8',
    //   gasPrice: '0x2540be400',
    //   to: '0xe242e54155b1abc71fc118065270cecaaf8b7768',
    //   value: 0,
    //   data: '0x12345678',
    //   // -- m/44'/60'/0'/0/0
    //   signerPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
    //   chainId: chainId,
    //   useEIP155: false,
    // }
    // const signOpts = {
    //     currency: 'ETH',
    //     data: data,
    // }

   
    return {
      signMessage: async(hash) => {
        return await new Promise((resolve, reject) => { 
          client.connect(signerExtra.deviceId, async(err, isPaired) => {  
            if (typeof isPaired === 'undefined' || !isPaired) {
              throw new Error('The Lattice device is not paired.')
            }

            const dataMsg = {
              protocol: 'signPersonal',
              payload: ethers.utils.hexlify(hash),
              signerPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
            }

            const signOptsMsg = {
                currency: 'ETH_MSG',
                data: dataMsg,
            }
             
            client.sign(signOptsMsg, (err, signedTx) => {
              if (err) {
                //TODO: add a toast here
              }
              let signedMsg = ''
              if (signedTx) {
                signedMsg = '0x' + signedTx.sig.r + signedTx.sig.s + signedTx.sig.v[0].toString(16)
                resolve(signedMsg)
              } else {
                reject(err)
              }
            })
          })
        }) 
    },
      // signTransaction: async params => await client.connect(deviceId, async(err, isPaired) => { 
      //   if (typeof isPaired === 'undefined' || !isPaired) {
      //     throw new Error('The Lattice device is not paired.')
      //   }
        
      //   await client.sign({...params, signerPath : signer.address})
      // })
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
