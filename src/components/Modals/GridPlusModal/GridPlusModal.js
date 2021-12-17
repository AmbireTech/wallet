import './GridPlusModal.scss'

import { Modal, Button, TextInput, Loading } from '../../common'
import { useState } from 'react'
import { useToasts } from '../../../hooks/toasts'
import { useModals } from '../../../hooks'
import { Client } from 'gridplus-sdk'

const crypto = require('crypto')
// const privKey = crypto.randomBytes(32).toString('hex')
const privKey = '60dd502e869a7d3dac752cc7d5dd7dbe40b1f06293865c1e91f6b8f7ac938c00'

const GridPlusModal = ({addresses}) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    // const [secret, setSecret] = useState('')
    // const [hasActiveWallet, setHasActiveWallet] = useState(false)

    const clientConfig = {
        name: 'Ambire Wallet',
        crypto: crypto,
        privKey: privKey
    }
    
    const client = new Client(clientConfig)

    const connectToDevice = async() => {
        setLoading(true)
        //TODO Try/catch
        // const serial = 'prMGjf'
        client.connect(deviceId, (err, isPaired) => {
            if (err) {
                setLoading(false)
                return addToast(`GridPlus: ${err} Or check if the DeviceID is correct.`, { error: true })
            }
            
            if (typeof isPaired === 'undefined' || !isPaired) {
                const secret = prompt('Enter Secret')
               
                client.pair(secret, err => {
                    if (err) {
                        setLoading(false)
                        return addToast('GridPlus: ' + err, { error: true })
                    }

                    const HARDENED_OFFSET = 0x80000000;
                    const req = {
                        startPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
                        n: 10
                    };
                    client.getAddresses(req, (err, res) => {
                        // console.log('res', res)
                        addresses(res)
                        setLoading(false)
                    })
                })
            } else {
                const HARDENED_OFFSET = 0x80000000;
                const req = {
                    startPath: [HARDENED_OFFSET+44, HARDENED_OFFSET+60, HARDENED_OFFSET, 0, 0],
                    n: 10
                };
                client.getAddresses(req, (err, res) => {
                    // console.log('res', res)
                    addresses(res)
                    setLoading(false)
                })
            }
        })
    }

    const resetForm = () => {
        setDeviceId('')
    }

    return (
        <Modal title="Two Factor Authentication">
            <div id="grid-plus">
                <div>
                    <p>The deviceId is listed on your Lattice under <strong>Settings</strong>.</p>
                    <h4>Device ID</h4>
                    <TextInput
                        required
                        placeholder="Enter the device ID"
                        onInput={value => setDeviceId(value)}
                    />
                    {isLoading ? (<><h3>It may takes a while.</h3><h3>Please wait...</h3></>) : (<></>)}
                    <div className="buttons">
                        {!isLoading ? (<Button onClick={connectToDevice}>Connect to Wallet</Button>) : (<Button disabled><Loading /></Button>)}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default GridPlusModal
