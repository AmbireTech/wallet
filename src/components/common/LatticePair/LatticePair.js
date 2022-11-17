import { Button, TextInput, Loading } from 'components/common'
import React, { useState, useEffect, useRef } from 'react'
import { useToasts } from 'hooks/toasts'
import { latticeInit, latticeConnect, latticePair, latticeGetAddresses } from 'lib/lattice'
import crypto from 'crypto'
import styles from './LatticePair.module.scss'

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

  useEffect(() => {
    if (isSecretFieldShown) inputSecretRef.current.focus()
  }, [isSecretFieldShown])

  const client = latticeInit(commKey)

  const connectToDevice = async () => {
    setLoading((prevState) => !prevState)

    const { isPaired, errConnect } = await latticeConnect(client, deviceId)
    if (errConnect) {
      setLoading((prevState) => !prevState)
      addToast(`Lattice: ${errConnect} Or check if the Device ID is correct.`, { error: true })
      return
    }

    if (!isPaired) {
      setIsSecretFieldShown((prevState) => !prevState)

      const enteredSecret = await new Promise((resolve) => {
        setPromiseResolve(() => resolve)
      })
      if (enteredSecret !== '') {
        setIsSecretFieldShown((prevState) => !prevState)

        const { hasActiveWallet, errPair } = await latticePair(client, enteredSecret)
        if (errPair) {
          setLoading((prevState) => !prevState)
          addToast(errPair, { error: true })
          return
        }

        if (!hasActiveWallet) {
          addToast('Lattice has no active wallet!')
          return
        }

        const { res, errGetAddresses } = await latticeGetAddresses(client)
        if (errGetAddresses) {
          setLoading((prevState) => !prevState)
          addToast(errGetAddresses, { error: true })
          return
        }

        if (res) {
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

      if (res) {
        addresses({ addresses: res, deviceId, commKey, isPaired: true })
        setLoading(false)
      }
    }
  }

  const handleInputSecret = (e) => {
    const inputSecret = e.toUpperCase()

    if (inputSecret.length === SECRET_LENGTH) {
      promiseResolve(inputSecret)
    }
  }

  const handleInputDeviceId = (e) => {
    if (e.length === DEVICE_ID_LENGTH) {
      setDeviceId(e)
    }
  }

  const buttons = !isLoading ? (
    <Button onClick={connectToDevice}>Connect to Wallet</Button>
  ) : (
    <Button disabled>
      <Loading />
    </Button>
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Connect to Lattice Device</div>
      <div className={styles.content}>
        <p>
          The device ID is listed on your Lattice under <strong>Settings</strong>.
        </p>
        <h4>Device ID</h4>
        <TextInput
          disabled={isSecretFieldShown}
          placeholder="Enter the device ID"
          onInput={(value) => handleInputDeviceId(value)}
        />
        {isSecretFieldShown && (
          <>
            <h4>Secret</h4>
            <TextInput
              ref={inputSecretRef}
              placeholder="Enter secret"
              style={{ textTransform: 'uppercase' }}
              onInput={(value) => handleInputSecret(value)}
            />
          </>
        )}
        {isLoading && !isSecretFieldShown && (
          <>
            <h3>It may takes a while.</h3>
            <h3>Please wait...</h3>
          </>
        )}
        {buttons}
      </div>
    </div>
  )
}

export default LatticePair
