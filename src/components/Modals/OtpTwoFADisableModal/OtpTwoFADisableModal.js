import { useModals } from 'hooks'
import { fetchPost } from 'lib/fetch'
import { Modal, Button, TextInput } from 'components/common'
import { useState, useEffect } from 'react'
import { useToasts } from 'hooks/toasts'
import { ethers } from 'ethers'
import { CountdownTimer } from 'components/common'
import styles from './OtpTwoFADisableModal.module.scss'

const TIMER_IN_SECONDS = 300

const OtpTwoFADisableModal = ({ relayerURL, selectedAcc, setCacheBreak }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const [isLoading, setLoading] = useState(false)

    const [receivedOtp, setReceivedOTP] = useState('')
    const [isTimeIsUp, setIsTimeIsUp] = useState(false)
    const [hexSecret, setHexSecret] = useState()
    
    useEffect(() => {
      setHexSecret(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify({ otp: null, timestamp: new Date().getTime() }))))
    }, [])

    const handleSubmit = e => {
      e.preventDefault()
      setLoading(true)
      disableOTP()
    }

    const disableOTP = async() => {
      try {
          const { success, signatureEthers, message } = await fetchPost(
            // network doesn't matter when signing
            `${relayerURL}/second-key/${selectedAcc.id}/ethereum/sign`, { 
              toSign: hexSecret, 
              code: receivedOtp 
            })
          if (!success) {
              throw new Error(message || 'unknown error')
          }

          const resp = await fetchPost(
            `${relayerURL}/identity/${selectedAcc.id}/modify`, { 
              otp: hexSecret, 
              sig: signatureEthers 
            })

          if (resp.success) {
              addToast(`You have successfully disabled two-factor authentication.`)
              setCacheBreak() 
              resetForm()
              setLoading(false)
              hideModal()
          } else {
              throw new Error(`${resp.message || 'unknown error'}`)
          }
      } catch (e) {
          console.error(e)
          addToast('OTP: ' + e.message || e, { error: true })
          setLoading(false)
      }
    }

    const resetForm = () => {
      setReceivedOTP('')
    }

    const handleTimeIsUp = (val) => {
        setIsTimeIsUp(val)
    }

    return (
        <Modal 
          className={styles.wrapper} 
          title="Disable Two Factor Authentication" 
          buttons={<Button form="disable2faForm" className={styles.button} variant="primaryGradient" type="submit" disabled={isTimeIsUp} loading={isLoading}>Disable 2FA</Button>}
        >
          <form onSubmit={handleSubmit} id="disable2faForm">
            {isTimeIsUp && <div className={styles.timerResetMsg}>Please reopen the modal to reset the session.</div>}
            <CountdownTimer seconds={TIMER_IN_SECONDS} setTimeIsUp={handleTimeIsUp} className={styles.timer} />
            <div>
              <h4>Authenticator app code</h4>
                <TextInput
                  className={styles.input}
                  placeholder="Enter the code from authenticator app"
                  onInput={setReceivedOTP}
                  value={receivedOtp}
                  pattern="[0-9]{6}"
                  required
                />
            </div>
          </form>
        </Modal>
    )
}

export default OtpTwoFADisableModal
