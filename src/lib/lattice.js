import { Client } from 'gridplus-sdk'
import { ethers } from 'ethers'
import { serialize } from '@ethersproject/transactions'

const crypto = require('crypto')
const HARDENED_OFFSET = 0x80000000

const getAddressesReqOpts = {
    startPath: [
        HARDENED_OFFSET + 44,
        HARDENED_OFFSET + 60,
        HARDENED_OFFSET,
        0,
        0,
    ],
    n: 10,
}

const latticeInit = commKey => {
    const clientConfig = {
        name: 'Ambire Wallet',
        crypto: crypto,
        privKey: commKey,
    }

    return new Client(clientConfig)
}

const latticeConnect = async(client, deviceId) => {
    try {
        const isPaired = await new Promise((resolve, reject) => {
            client.connect(deviceId, (err, isPaired) => {
                if (err) {
                    reject(`Lattice connect: ${err} Or check if the DeviceID is correct.`)
                    return
                }
                
                resolve({ isPaired: !!isPaired, errConnect: false })
            })
        })
        
        return isPaired
    } catch (err) {
        console.error(err)

        return { isPaired: false, errConnect: err }
    }
}

const latticePair = async(client, secret) => {
    try {
        const hasActiveWallet = await new Promise((resolve, reject) => {
            client.pair(secret, (err, hasActiveWallet) => {
                if (err) {
                    reject(`Lattice connect: ${err}`)
                    return
                }
                
                resolve({ hasActiveWallet, errPair: false })
            })
        })
        
        return hasActiveWallet
    } catch (err) {
        console.error(err)
        return { hasActiveWallet: false, errPair: err }
    }
}

const latticeGetAddresses = async client => {
    try {
        const res = await new Promise((resolve, reject) => {
            client.getAddresses(getAddressesReqOpts, (err, res) => {
                if (err) {
                    reject(`Lattice get addresses: ${err}`)
                    return
                }

                if (!res) throw new Error('Lattice could not get the addresses.')

                resolve({res, errGetAddresses: false })
            })
        })

        return res
    } catch (err) {
        console.error(err)
        return { res: null, errGetAddresses: err }
    }
}

const latticeSignMessage = async(client, hash) => {
    const dataMsg = {
        protocol: 'signPersonal',
        payload: ethers.utils.hexlify(hash),
        signerPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
    }

    const signOptsMsg = {
        currency: 'ETH_MSG',
        data: dataMsg,
    }

    try {
        const sign = await new Promise((resolve, reject) => {
            client.sign(signOptsMsg, (err, signedTx) => {
                if (err) {
                    reject(err)
                    return
                }

                if (!signedTx) throw new Error('Lattice could not sign the message.')
                
                resolve({ signedMsg: '0x' + signedTx.sig.r + signedTx.sig.s + signedTx.sig.v[0].toString(16), errSignMessage: false })  
            })
        })

        return sign
    } catch (err) {
        console.error(err)
        return { signedMsg: null, errSignMessage: err }
    }
}

const latticeSignTransaction = async(client, txn, chainId) => {
    const { to, data, gas, gasPrice, nonce } = txn
    const unsignedTxObj = {
        ...txn,
        gasLimit: txn.gasLimit || txn.gas,
        chainId
    }
    delete unsignedTxObj.from
    delete unsignedTxObj.gas

    const txData = {
        nonce,
        gasLimit: gas,
        gasPrice,
        to,
        value: 0,
        data,
        // -- m/44'/60'/0'/0/0
        signerPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
        chainId,
        useEIP155: true,
    }

    const signOpts = {
        currency: 'ETH',
        data: txData,
    }

    try {
        const signTx = await new Promise((resolve, reject) => {
            client.sign(signOpts, (err, signedTx) => {
                if (err) {
                    reject(err)
                    return
                }

                if (!signedTx) throw new Error('Lattice could not sign the message.')
                
                delete unsignedTxObj.v
                const serializedSigned = serialize(unsignedTxObj, {
                    r: '0x' + signedTx.sig.r,
                    s: '0x' + signedTx.sig.s,
                    v: signedTx.sig.v[0].toString(16)
                })
                
                resolve({ serializedSigned, errSignTxn: false })
            })
        })

        return signTx
    } catch (err) {
        console.error(err)
        return { serializedSigned: null, errSignTxn: err }
    }
}

export { 
    latticeInit,
    latticeConnect,
    latticePair,
    latticeGetAddresses,
    latticeSignMessage,
    latticeSignTransaction
 }
