import './GridPlusModal.scss'

import { Modal, Button, TextInput, Loading } from '../../common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToasts } from '../../../hooks/toasts'
import { useModals } from '../../../hooks'
import { Client } from 'gridplus-sdk'

const crypto = require('crypto');
// const privKey = crypto.randomBytes(32).toString('hex')
const privKey =  'd74c284a46f1d6acbe70f3e778046bb0afff254b0f667482436f46107270a568'

const GridPlusModal = () => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    const [secret, setSecret] = useState('')
    const [isDevicePaired, setIsDevicePaired] = useState(false)
    const [hasActiveWallet, setHasActiveWallet] = useState(false)

    
    const clientConfig = {
        name: 'Ambire Wallet',
        crypto: crypto,
        privKey: privKey
    }

    const client = new Client(clientConfig)

    const connectToDevice = () => { 
        //Wrap in try/catch
        if (!deviceId.length) addToast('The device ID is empty!', { error: true})
        client.connect(deviceId, (err, isPaired) => {
            setIsDevicePaired(isPaired)
            addToast('The wallet is connected')
            addToast(`IS PAIRED: ${isPaired}`)
        })
    }

    const pairWithDevice = () => {
        // if (!isDevicePaired) addToast('The device is not connected!', { error: true})
        // if (!secret.length) addToast('The secret is empty!', { error: true})
        console.log('secret', secret);
        client.pair(secret, (err, hasActiveWallet) => {
            // setHasActiveWallet(hasActiveWallet)

            // console.log('hasActiveWallet', hasActiveWallet);
            //TODO: Remove the code below
            // const HARDENED_OFFSET = 0x80000000;
            // const req = {
            //     startPath: [HARDENED_OFFSET+44, HARDENED_OFFSET, HARDENED_OFFSET, 0, 0],
            //     n: 4
            // };
            // client.addresses(req, (err, res) => {
            //     console.log('res', res)
            // })
        })
    }

    const resetForm = () => {
        setDeviceId('')
        setSecret('')
    }

    return (
        <Modal title="Two Factor Authentication">
            <div id="grid-plus">
                <div>
                    <h4>Device ID</h4>
                    <h4>prMGjf</h4>
                    <TextInput
                        required
                        placeholder="Enter the device ID"
                        onInput={value => setDeviceId(value)}
                    />
                    <Button onClick={connectToDevice}>Connect to Wallet</Button>
                    <h4>Set Secret</h4>
                    <TextInput
                        placeholder="Enter the secret code from the device"
                        onInput={setSecret}
                        value={secret}
                        required
                    />
                    <Button onClick={pairWithDevice}>Pair the wallet</Button>
                </div>
            </div>
        </Modal>
    )
}

export default GridPlusModal
