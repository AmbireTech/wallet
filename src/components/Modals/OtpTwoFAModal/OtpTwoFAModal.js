import './OtpTwoFAModal.scss'

import { Modal, Button, TextInput, Loading } from '../../common'
import { authenticator } from '@otplib/preset-default'
import QRCode from 'qrcode'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToasts } from '../../../hooks/toasts'
import { Wallet } from 'ethers'
import { fetchPost } from '../../../lib/fetch'
import { useModals } from '../../../hooks'

const OtpTwoFAModal = ({ relayerURL, selectedAcc, setCacheBreak }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const secret = useMemo(() => authenticator.generateSecret(20), []) 
    
    const [isLoading, setLoading] = useState(false)
    const [imageURL, setImageURL] = useState(null)
    const [receivedOtp, setReceivedOTP] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')

    const generateQR = useCallback(() => {
        const otpAuth = authenticator.keyuri(
            selectedAcc.email,
            'Ambire Wallet',
            secret
        )
        
        QRCode.toDataURL(otpAuth, (error, url) => {
            if (error) {
                console.log(error)
                addToast(error.message, { error: true })
            } else {
                setImageURL(url)
            }
        })
    }, [addToast, secret, selectedAcc.email])

    useEffect(generateQR, [generateQR])

    const handleSubmit = e => {
        e.preventDefault()
        verifyOTP()
    }

    const verifyOTP = async () => {
        const isValid = authenticator.verify({ token: receivedOtp, secret })
        const otp = secret

        if (!isValid) {
            addToast('Invalid or outdated OTP code entered. If you keep seeing this, please ensure your system clock is synced correctly.', { error: true })
            return
        }

        setLoading(true)
        
        try {
            const wallet = await Wallet.fromEncryptedJson(
                JSON.parse(selectedAcc.primaryKeyBackup),
                currentPassword
            )
            const sig = await wallet.signMessage(JSON.stringify({ otp }))
            const resp = await fetchPost(`${relayerURL}/identity/${selectedAcc.id}/modify`, { otp, sig })

            if (resp.success) {
                addToast(`You have successfully enabled two-factor authentication.`)
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
        setReceivedOTP('')
    }

    return (
        <Modal title="Two Factor Authentication">
            {isLoading ? (
                <div id="loading-overlay">
                    <Loading />
                </div>
            ) : null}
            <div id="otp-auth">
                <div className="img-wrapper">
                    <img alt="qr-code" src={imageURL}></img>
                </div>
                <div className="img-msg" style={{ marginBottom: showSecret ? '0px' : '22px'}}>
                    Unable to see?{' '}
                    <span className="click-here" onClick={() => { setShowSecret(prevState => !prevState) }}>
                        Click here.
                    </span>
                    {showSecret && <div>{secret}</div>}
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <h4>Account password</h4>
                        <TextInput
                            password
                            required
                            pattern=".{8,}"
                            autocomplete="current-password"
                            placeholder="Enter the account password"
                            onInput={value => setCurrentPassword(value)}
                        />
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
                        <Button type="submit">OK</Button>
                    </div>
                </form>
            </div>
        </Modal>
    )
}

export default OtpTwoFAModal
