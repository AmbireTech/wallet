import { Client } from 'gridplus-sdk'

const crypto = require('crypto')

const HARDENED_OFFSET = 0x80000000

const Lattice = (commKey = crypto.randomBytes(32).toString('hex'), deviceId = '') => {
    // commKey = crypto.randomBytes(32).toString('hex')

    const clientConfig = {
        name: 'Ambire Wallet',
        crypto: crypto,
        privKey: commKey,
    }

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

    const client = new Client(clientConfig)

    const connectToDevice = (deviceId, fn) => {
        return client.connect(deviceId, (err, isPaired) => {
            return fn({ err: err, isPaired: isPaired})
        })
    }

    const pairWithDevice = (res, fn) => {
        return client.pair(res, (err, hasActiveWallet) => {
            if (err) {
                // setLoading(prevState => !prevState)
                // addToast('Lattice: ' + err, { error: true })
                fn(false)
                return
            }

            if (!hasActiveWallet) {
                // addToast('Lattice has no active wallet!')
                fn(false)
                return
            }

            fn(true)
        })
    }

    const getAddressesFromDevice = fn => {
        return client.getAddresses(getAddressesReqOpts, (err, res) => {
            if (err) {
                // setLoading(prevState => !prevState)

                return fn(false)
                // return addToast(`Lattice: ${err}`, {
                //     error: true,
                // })
            }

            return fn(res)
        })
    }
}

export default Lattice