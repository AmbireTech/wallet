import { Client } from 'gridplus-sdk'

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
    //TODO: Remove hardcoded commKey
    // commKey = 'ef903967c21ec517d2df66eae824856f6dd8c99694bd2d8ee9fc85e329a51341'
    // commKey = commKey || useMemo(() => crypto.randomBytes(32).toString('hex'), [])

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

const latticeSignMessage = async client => {
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

//TODO: SignMessage

export { 
    latticeInit,
    latticeConnect,
    latticePair,
    latticeGetAddresses,
    latticeSignMessage
 }
