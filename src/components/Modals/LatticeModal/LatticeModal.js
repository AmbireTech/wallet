import './LatticeModal.scss'

import { Modal, Button, TextInput, Loading } from 'components/common'
import { useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { Client } from 'gridplus-sdk'
import Lattice from 'lib/lattice'

const crypto = require('crypto')

const HARDENED_OFFSET = 0x80000000
// const privKey = crypto.randomBytes(32).toString('hex')
const privKey = 'ef903967c21ec517d2df66eae824856f6dd8c99694bd2d8ee9fc85e329a51341'

const LatticeModal = ({ addresses }) => {
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    const [isSecretFieldShown, setIsSecretFieldShown] = useState(false)
    const [promiseResolve, setPromiseResolve] = useState(null)

    // const privKey = crypto.randomBytes(32).toString('hex')
    
    const clientConfig = {
        name: 'Ambire Wallet',
        crypto: crypto,
        privKey: privKey,
    }

    const getAddressesReqOpts = {
        startPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
        n: 10
    }

    const client = new Client(clientConfig)

    const connectToDevice = async () => {
        setLoading(prevState => !prevState)
        
        connectDevice(deviceId, ({err, isPaired}) => {
            if (err) {
                setLoading(prevState => !prevState)
                return addToast(`Lattice: ${err} Or check if the DeviceID is correct.`, { error: true })
            }

            if (typeof isPaired === 'undefined' || !isPaired) {
                setIsSecretFieldShown(prevState => !prevState)

                const enteringSecret = new Promise((resolve, reject) => { setPromiseResolve(() => resolve) })
                
                enteringSecret.then((res, rej) => {
                    setIsSecretFieldShown(prevState => !prevState)
                    
                    pairWithDevice(res, ({err, hasActiveWallet}) => {
                        if (err) {
                            setLoading(prevState => !prevState)
                            addToast('Lattice: ' + err, { error: true })
                            return
                        }
            
                        if (!hasActiveWallet)  {
                            addToast('Lattice has no active wallet!')
                            return
                        }
                        getAddressesFromDevice(getAddressesReqOpts, (res) => {
                            if (!res) return addToast('Failed to get addresses', {error: true})
                            setLoading(prevState => !prevState)
                            
                            if (!!res) {
                                addresses({
                                    addresses: res,
                                    deviceId: deviceId,
                                    privKey: privKey,
                                    isPaired: true
                                })
                            } else {
                                setLoading(false)
                            }
                        })
                    })
                })
            } else {
                getAddressesFromDevice(getAddressesReqOpts, (err,res) => {
                    if (err) {
                        setLoading(false)
                        return addToast(`Lattice: ${err}`, { error: true })
                    }
                    
                    setLoading(prevState => !prevState)
                    
                    if (!!res) {
                        addresses({
                            addresses: res,
                            deviceId: deviceId,
                            privKey: privKey,
                            isPaired: true
                        })
                    } else {
                        setLoading(false)
                    }
                })
            }
        })
    }

    const connectDevice = (deviceId, fn) => {
        return client.connect(deviceId, (err, isPaired) => {
            fn({ error: err, isPaired: isPaired})
        })
    }


    const pairWithDevice = (res, fn) => {
       return client.pair(res, (err, hasActiveWallet) => {
            fn({err: err, hasActiveWallet: hasActiveWallet})
        })
    }

    const getAddressesFromDevice = (getAddressesReqOpts, fn) => {
        return client.getAddresses(getAddressesReqOpts, (err, res) => {
            if (err) {
                setLoading(prevState => !prevState)
                
                fn(false)
                return addToast(`Lattice: ${err}`, {
                    error: true,
                })
            }
            
            fn(res)
        })
    }

    const handleInputSecret = e => {
        const inputSecret = e.toUpperCase()
        // TODO: add constant for 8 
        if (inputSecret.length === 8) {
            promiseResolve(inputSecret)
        } 
    }

    const handleInputDeviceId = e => {
        // TODO: add constant for 6
        if (e.length === 6) {
            setDeviceId(e)
        }
    }

    return (
        <Modal title="Connect to Lattice Device">
            <div id="grid-plus">
                <div>
                    <p>
                        The deviceId is listed on your Lattice under{' '}
                        <strong>Settings</strong>.
                    </p>
                    <h4>Device ID</h4>
                    <TextInput
                        disabled={isSecretFieldShown}
                        placeholder="Enter the device ID"
                        onInput={value => handleInputDeviceId(value)}
                    />
                    {isSecretFieldShown && (
                        <>
                            <h4>Secret</h4>
                            <TextInput
                                placeholder="Enter secret"
                                style={{ textTransform:'uppercase' }}
                                onInput={value => handleInputSecret(value)}
                            />
                        </>
                    )}
                    {(isLoading && !isSecretFieldShown) ? (
                        <>
                            <h3>It may takes a while.</h3>
                            <h3>Please wait...</h3>
                        </>
                    ) : (
                        <></>
                    )}
                    <div className="buttons">
                        {!isLoading ? (
                            <Button onClick={connectToDevice}>
                                Connect to Wallet
                            </Button>
                        ) : (
                            <Button disabled>
                                <Loading />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default LatticeModal
