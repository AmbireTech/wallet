import './OtpTwoFADisableModal.scss'
import { useModals } from 'hooks'
import { fetchPost } from 'lib/fetch'
import { Modal, Button, TextInput, Loading } from 'components/common'
import { useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { ethers } from 'ethers'

const OtpTwoFADisableModal = ({ relayerURL, selectedAcc, setCacheBreak }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const [isLoading, setLoading] = useState(false)
    const hexSecret = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify({otp: null, timestamp: new Date().getDate()})))

    const [receivedOtp, setReceivedOTP] = useState('')

    const handleSubmit = async e => {
      e.preventDefault()
      setLoading(true)
      await disableOTP()
    }

    const disableOTP = async() => {
      try {
          const { success, signature, message } = await fetchPost(`${relayerURL}/second-key/${selectedAcc.id}/ethereum/sign`, { otp: hexSecret, code: receivedOtp })
          if (!success) {
              throw new Error(message || 'unknown error')
          }

          const resp = await fetchPost(`${relayerURL}/identity/${selectedAcc.id}/modify`, { otp: hexSecret, sig: signature })

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

    return (
        <Modal id='disable-otp-modal' title="Disable Two Factor Authentication">
          <form onSubmit={handleSubmit}>
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
              {!isLoading ? (<Button type="submit">Disable 2FA</Button>) : (<Button disabled><Loading /></Button>)}
            </div>
          </form>
        </Modal>
    )
}

export default OtpTwoFADisableModal
