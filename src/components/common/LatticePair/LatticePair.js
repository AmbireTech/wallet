import styles from './LatticePair.module.scss'

import {Button, TextInput, Loading, Info, Note} from 'components/common'
import { useState, useEffect, useRef } from 'react'
import { useToasts } from 'hooks/toasts'
import { latticeInit, 
    latticeConnect, 
    latticePair, 
    latticeGetAddresses 
} from 'lib/lattice'
import crypto from 'crypto'

const SECRET_LENGTH = 8
const DEVICE_ID_LENGTH = 6
const commKey = crypto.randomBytes(32).toString('hex')

const LatticePair = ({ addresses }) => {
    const { addToast } = useToasts()
    const [isLoading, setLoading] = useState(false)
    const [deviceId, setDeviceId] = useState('')
    const [isSecretFieldShown, setIsSecretFieldShown] = useState(false)
    const [promiseResolve, setPromiseResolve] = useState(null)
    const inputSecretRef = useRef(null)
    
    useEffect(()=> {
        if (isSecretFieldShown) inputSecretRef.current.focus()
    }, [isSecretFieldShown])

    const client = latticeInit(commKey)

    const connectToDevice = async () => {
        setLoading(prevState => !prevState)

        const { isPaired, errConnect } = await latticeConnect(client, deviceId)
        if (errConnect) {
            setLoading(prevState => !prevState)
            addToast(`Lattice: ${errConnect} Or check if the Device ID is correct.`, { error: true })
            return
        }

        if (!isPaired) {
            setIsSecretFieldShown(prevState => !prevState)

            const enteredSecret = await new Promise((resolve, reject) => { setPromiseResolve(() => resolve) })
            if (enteredSecret !== '') { 
                setIsSecretFieldShown(prevState => !prevState)

                const { hasActiveWallet, errPair } = await latticePair(client, enteredSecret)
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
                    addresses({ addresses: res, deviceId, commKey, isPaired: true })
                    setLoading(false)
                } 
            }
        } else {
            const { res, errGetAddresses } = await latticeGetAddresses(client)
            if (errGetAddresses) {
                setLoading(false)
                addToast(`Lattice: ${errGetAddresses}`, { error: true })
                return 
            }

            if (!!res) {
                addresses({ addresses: res, deviceId, commKey, isPaired: true })
                setLoading(false)
            }
        }
    }

    const handleInputSecret = e => {
        const inputSecret = e.toUpperCase()
        
        if (inputSecret.length === SECRET_LENGTH) {
            promiseResolve(inputSecret)
        } 
    }

    const handleInputDeviceId = e => {
        if (e.length === DEVICE_ID_LENGTH) {
            setDeviceId(e)
        }
    }

    const buttons = <div className={styles.buttons}>
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

    return (
        <div className={styles.wrapper}>
            <div className={styles.title}>Connect to Lattice Device</div>
            <div className={styles.content}>
                <div className={styles.formItem}>
                    <label>1. Enter Device</label>
                    <TextInput
                        disabled={isSecretFieldShown}
                        placeholder="Enter the device ID"
                        onInput={value => handleInputDeviceId(value)}
                    />
                </div>
                {isSecretFieldShown && (
                    <div className={styles.formItem}>
                        <label>2. Enter Secret</label>
                        <TextInput
                            ref={inputSecretRef}
                            placeholder="Enter secret"
                            onInput={value => handleInputSecret(value)}
                        />
                    </div>
                )}
                {(isLoading && !isSecretFieldShown) && (
                    <div className={styles.loadingText}>It may takes a while. Please wait...</div>
                )}
            </div>
            { isSecretFieldShown ? <Note className={styles.info}>
                Enter your SECRET from your GRID+ device
            </Note> : <Info className={styles.info}>
                The device ID is listed on your Lattice under <strong>Settings</strong>
            </Info>}

            {buttons}
        </div>
    )
}

export default LatticePair
