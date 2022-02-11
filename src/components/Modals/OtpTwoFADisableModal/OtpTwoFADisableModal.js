import './OtpTwoFADisableModal.scss'
import { useModals } from 'hooks'
import { fetchPost } from 'lib/fetch'
import { Modal, Button, TextInput, Loading } from 'components/common'
import { useState, useEffect } from 'react'
import { useToasts } from 'hooks/toasts'
import { ethers } from 'ethers'
import { CountdownTimer } from 'components/common'

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
        <Modal id='disable-otp-modal' 
          title="Disable Two Factor Authentication" 
          topLeft={(<CountdownTimer seconds={TIMER_IN_SECONDS} setTimeIsUp={handleTimeIsUp}/>)}
        >
          <form onSubmit={handleSubmit}>
            {isTimeIsUp && <div className='timer-reset-msg'>Please reopen the modal to reset the session.</div>}
            <div>
              <h4>Authenticator app code</h4>
                <TextInput
                    placeholder="Enter the code from authenticator app"
                    onInput={setReceivedOTP}
                    value={receivedOtp}
                    pattern="[0-9]{6}"
                    required
                />
            </div>
            <div className="buttons">
              {!isLoading ? (<Button type="submit" disabled={isTimeIsUp}>Disable 2FA</Button>) : (<Button disabled><Loading /></Button>)}
            </div>
          </form>
        </Modal>
    )
}

export default OtpTwoFADisableModal
