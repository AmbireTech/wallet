import './OtpTwoFADisableModal.scss'
import { useModals } from '../../../hooks'
import { fetchPost } from '../../../lib/fetch'
import { Modal, Button, TextInput, Loading } from '../../common'
import { useState } from 'react'
import { Wallet } from '@ethersproject/wallet'
import { useToasts } from '../../../hooks/toasts'

const OtpTwoFADisableModal = ({ relayerURL, selectedAcc, setCacheBreak }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const [isLoading, setLoading] = useState(false)

    const otp = null
    const [currentPassword, setCurrentPassword] = useState('')

    const handleSubmit = e => {
      e.preventDefault()
      disableOTP()
    }

    const disableOTP = async() => {
      setLoading(true)

      try {
          const wallet = await Wallet.fromEncryptedJson(
              JSON.parse(selectedAcc.primaryKeyBackup),
              currentPassword
          )
          
          const sig = await wallet.signMessage(JSON.stringify({ otp }))
          const resp = await fetchPost(`${relayerURL}/identity/${selectedAcc.id}/modify`, { otp, sig })

          if (resp.success) {
              addToast(`You have successfully disabled two-factor authentication.`)
              setCacheBreak() 
              resetForm()
              hideModal()
          } else {
              throw new Error(`${resp.message || 'unknown error'}`)
          }
      } catch (e) {
          console.error(e)
          addToast('OTP: ' + e.message || e, { error: true })
      }

      setLoading(false)
    }

    const resetForm = () => {
      setCurrentPassword('')
    }

    return (
        <Modal id='disable-otp-modal' title="Disable Two Factor Authentication">
            {isLoading ? (
              <div id="loading-overlay">
                  <Loading />
                </div>
            ) : null}
            <form onSubmit={handleSubmit}>
                <div>
                    <h4>Enter your account password</h4>
                    <TextInput
                        password
                        required
                        pattern=".{8,}"
                        autocomplete="current-password"
                        placeholder="Account Password"
                        onInput={value => setCurrentPassword(value)}
                    />
                </div>
                <div className="buttons">
                  <Button type="submit">OK</Button>
                </div>
            </form>
        </Modal>
    )
}

export default OtpTwoFADisableModal
