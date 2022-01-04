import './LatticeModal.scss'

import { Modal, Button, TextInput, Loading } from '../../common'
import { useState } from 'react'
import { useToasts } from '../../../hooks/toasts'
import { Client } from 'gridplus-sdk'

const crypto = require('crypto')

const HARDENED_OFFSET = 0x80000000

const LatticeModal = ({ addresses }) => {
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    const [isSecretFieldShown, setIsSecretFieldShown] = useState(false)
    const [promiseResolve, setPromiseResolve] = useState(null)

    const privKey = crypto.randomBytes(32).toString('hex')
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
        
        client.connect(deviceId, (err, isPaired) => {
            if (err) {
                setLoading(prevState => !prevState)
                return addToast(`Lattice: ${err} Or check if the DeviceID is correct.`, { error: true })
            }

            if (typeof isPaired === 'undefined' || !isPaired) {
                setIsSecretFieldShown(prevState => !prevState)

                const enteringSecret = new Promise((resolve, reject) => { setPromiseResolve(() => resolve) })
                
                enteringSecret.then((res, rej) => {
                    setIsSecretFieldShown(prevState => !prevState)
                    
                    // client.pair(res, err => {
                    //     if (err) {
                    //         setLoading(prevState => !prevState)
                    //         return addToast('Lattice: ' + err, { error: true })
                    //     }
                    
                    pairWithDevice(res, isOK => {
                        if (!isOK) return addToast('failed to pair', {error: true})
                        getAddressesFromDevice(getAddressesReqOpts, (res) => {
                            // if (err) {
                            //     setLoading(prevState => !prevState)
                            //     return addToast(`Lattice: ${err}`, {
                            //         error: true,
                            //     })
                            // }
                            if (!res) return addToast('failed to get addresses', {error: true})
                            setLoading(prevState => !prevState)
                            
                            addresses({
                                addresses: res,
                                deviceId: deviceId,
                                privKey: privKey,
                                isPaired: true
                            })
                        })
                    })
                })
            } else {
                client.getAddresses(getAddressesReqOpts, (err, res) => {
                    if (err) {
                        setLoading(false)
                        return addToast(`Lattice: ${err}`, { error: true })
                    }
                    
                    setLoading(prevState => !prevState)
                    addresses({ addresses: res })
                })
            }
        })
    }

    const pairWithDevice = (res, fn) => {
       return client.pair(res, err => {
            if (err) {
                setLoading(prevState => !prevState)
                addToast('Lattice: ' + err, { error: true })
                fn(false)
                return
            }

            fn(true)
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
            // setLoading(prevState => !prevState)
            
            // addresses({
            //     addresses: res,
            //     deviceId: deviceId,
            //     privKey: privKey,
            //     isPaired: true
            // })
        })
    }

    const handleConfirmSecretClicked = (e) => {
        const inputSecret = e.toUpperCase()
        // TODO: add constant for 8 
        if (inputSecret.length === 8) {
            promiseResolve(inputSecret)
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
                        onInput={value => setDeviceId(value)}
                    />
                    {isSecretFieldShown && (
                        <>
                            <h4>Secret</h4>
                            <TextInput
                                placeholder="Enter secret"
                                style={{ textTransform:'uppercase' }}
                                onInput={value => handleConfirmSecretClicked(value)}
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
