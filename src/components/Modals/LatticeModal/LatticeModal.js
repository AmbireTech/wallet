import './LatticeModal.scss'

import { Modal, Button, TextInput, Loading } from 'components/common'
import { useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { latticeInit, 
    latticeConnect, 
    latticePair, 
    latticeGetAddresses 
} from 'lib/lattice'

const LatticeModal = ({ addresses }) => {
    //TODO: remove hardcoded commKey
    const commKey = 'ef903967c21ec517d2df66eae824856f6dd8c99694bd2d8ee9fc85e329a51341'

    const { addToast } = useToasts()
    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    const [isSecretFieldShown, setIsSecretFieldShown] = useState(false)
    const [promiseResolve, setPromiseResolve] = useState(null)
    const client = latticeInit(commKey)

    const connectToDevice = async () => {
        setLoading(prevState => !prevState)

        const { isPaired, err } = await latticeConnect(client, deviceId)
        if (err) {
            setLoading(prevState => !prevState)
            addToast(`Lattice: ${err} Or check if the DeviceID is correct.`, { error: true })
            
            return
        }

        if (!isPaired) {
            setIsSecretFieldShown(prevState => !prevState)

            const enteringSecret = new Promise((resolve, reject) => { setPromiseResolve(() => resolve) })
            enteringSecret.then(async(resolve, reject) => { 
                setIsSecretFieldShown(prevState => !prevState)

                const { hasActiveWallet, errPair } = await latticePair(client, resolve)
                if (errPair) {
                    setLoading(prevState => !prevState)
                    addToast(errPair, { error: true })

                    return
                }

                if (!hasActiveWallet)  {
                    addToast('Lattice has no active wallet!')

                    return
                }

                const { res, errGetAddresses } = await latticeGetAddresses(client)
                if (errGetAddresses) {
                    setLoading(prevState => !prevState)
                    addToast(errGetAddresses, {error: true})
                    
                    return
                }

                if (!!res) {
                    addresses({
                        addresses: res,
                        deviceId: deviceId,
                        commKey: commKey,
                        isPaired: true
                    })
                    setLoading(false)
                } 
            })
        } else {
            const { res, errGetAddresses } = await latticeGetAddresses(client)
            if (errGetAddresses) {
                setLoading(false)
                addToast(`Lattice: ${err}`, { error: true })

                return 
            }

            if (!!res) {
                addresses({
                    addresses: res,
                    deviceId: deviceId,
                    commKey: commKey,
                    isPaired: true
                })
                setLoading(false)
            }
        }
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
