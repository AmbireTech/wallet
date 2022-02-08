import { Client } from 'gridplus-sdk'
import { ethers } from 'ethers'

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
                if (err) reject(`Lattice connect: ${err} Or check if the DeviceID is correct.`)
                
                resolve({ isPaired: !!isPaired, err: false })
            })
        })
        
        return isPaired
    } catch (err) {
        console.error(err)

        return { isPaired: false, err: err }
    }
}

const latticePair = async(client, secret) => {
    try {
        const hasActiveWallet = await new Promise((resolve, reject) => {
            client.pair(secret, (err, hasActiveWallet) => {
                if (err) reject(`Lattice connect: ${err}`)
                
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
                if (err) reject(`Lattice get addresses: ${err}`)

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
                let signedMsg

                if (err) reject(err)

                if (signedTx) {
                    signedMsg = '0x' + signedTx.sig.r + signedTx.sig.s + signedTx.sig.v[0].toString(16)
                    resolve({ signedMsg, errSignMessage: false })
                }
            })
        })

        return sign
    } catch (err) {
        console.error(err)

        return { signedMsg: null, errSignMessage: err }
    }
}

//TODO: add SignTransaction func

export { 
    latticeInit,
    latticeConnect,
    latticePair,
    latticeGetAddresses,
    latticeSignMessage
 }
