import { Modal, Button, TextInput, Loading } from 'components/common'
import { authenticator } from '@otplib/preset-default'
import QRCode from 'qrcode'
import cn from 'classnames'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { fetchPost } from 'lib/fetch'
import { useModals } from 'hooks'
import { ethers } from 'ethers'
import { CountdownTimer } from 'components/common'

import styles from './OtpTwoFAModal.module.scss'

const TIMER_IN_SECONDS = 300

const OtpTwoFAModal = ({ relayerURL, selectedAcc, setCacheBreak }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()

    const secret = useMemo(() => authenticator.generateSecret(20), []) 
    
    const [isLoading, setLoading] = useState(false)
    const [imageURL, setImageURL] = useState(null)
    const [receivedOtp, setReceivedOTP] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [emailConfirmCode, setEmailConfirmCode] = useState('')
    const [isTimeIsUp, setIsTimeIsUp] = useState(false)
    const [hexSecret, setHexSecret] = useState()
    
    useEffect(() => {
      setHexSecret(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify({ otp: secret, timestamp: new Date().getTime() }))))
    }, [secret])

    const generateQR = useCallback(() => {
        const otpAuth = authenticator.keyuri(
            selectedAcc.email,
            'Ambire Wallet',
            secret
        )

        const qrCodeOptions = {
            quality: 1,
            margin: 1,
        }
        
        QRCode.toDataURL(otpAuth, qrCodeOptions, (error, url) => {
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
        setLoading(true)
        verifyOTP()
    }

    const sendEmail = async() => {
        if (!relayerURL) {
            addToast('Email/pass accounts not supported without a relayer connection', { error: true })
            return
        }
        
        const { success, confCodeRequired } = await fetchPost(
            // network doesn't matter when signing
            `${relayerURL}/second-key/${selectedAcc.id}/ethereum/sign`, { 
                toSign: hexSecret 
            })
        if (!success) addToast('Unexpected error. This should never happen, please report this on help.ambire.com', { error: true })
        if (confCodeRequired !== 'email') addToast('Expected email verification. This should never happen, please report this on help.ambire.com', { error: true })
        if (success && confCodeRequired === 'email') addToast('A confirmation code was sent to your email, please enter it along...')
    }
    
    const verifyOTP = async () => {
        const isValid = authenticator.verify({ token: receivedOtp, secret })
        
        if (!isValid) {
            addToast('Invalid or outdated OTP code entered. If you keep seeing this, please ensure your system clock is synced correctly.', { error: true })
            setLoading(false)
            return
        }

        try {
            if (!emailConfirmCode.length) {
                addToast('Please enter the code from authenticator app.')
                return
            }

            const { success, signatureEthers, message } = await fetchPost(
                // network doesn't matter when signing
                `${relayerURL}/second-key/${selectedAcc.id}/ethereum/sign`, {
                    toSign: hexSecret, 
                    code: emailConfirmCode
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
                addToast(`You have successfully enabled two-factor authentication.`)
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
        setEmailConfirmCode('')
        setReceivedOTP('')
    }

    const handleTimeIsUp = (val) => {
        setIsTimeIsUp(val)
    }

    return (
        <Modal
            className={styles.modal}
            buttons={!isLoading ? (<Button form="enable2faForm" primaryGradient type="submit" disabled={isTimeIsUp} className={styles.button}>Enable 2FA</Button>) : (<Button disabled className={styles.button}><Loading /></Button>)}
            title="Two Factor Authentication" 
        >
            <div className={styles.wrapper}>
                {isTimeIsUp && <div className={styles.timerResetMsg}>Please reopen the modal to reset the session.</div>}
                <CountdownTimer seconds={TIMER_IN_SECONDS} setTimeIsUp={handleTimeIsUp} className={styles.timer} />
                <div className={styles.imgWrapper}>
                    <img alt="qr-code" src={imageURL}></img>
                </div>
                <div className={cn(styles.imgMsg, {[styles.showSecret]: showSecret})}>
                    {!showSecret && 
                    (<span className={styles.clickHere}>
                        Unable to scan code? <button onClick={() => setShowSecret(prevState => !prevState)}>Click here.</button>
                    </span>)}
                    {showSecret && (<><span>Enter this OTP in your app:</span><div>{secret}</div></>)}
                </div>
                <form onSubmit={handleSubmit} id="enable2faForm">
                    <div className={styles.emailWrapper}>
                        <h4>Confirmation code sent via Email</h4>
                        <div className={styles.emailBody}>
                            <TextInput
                                className={styles.emailInput}
                                title='Confirmation code should be 6 digits'
                                autoComplete='nope'
                                required minLength={6} maxLength={6}
                                placeholder='Confirmation code'
                                value={emailConfirmCode}
                                onInput={value => setEmailConfirmCode(value)}
                            ></TextInput>
                            
                            <Button type="button" primaryGradient disabled={isTimeIsUp} onClick={sendEmail}>Send Email</Button>
                        </div>
                    </div>
                    <div className={styles.authenticatorWrapper}>
                        <h4>Authenticator app code</h4>
                        <TextInput
                            placeholder="Enter the code from authenticator app"
                            onInput={setReceivedOTP}
                            value={receivedOtp}
                            pattern="[0-9]{6}"
                            required
                        />
                    </div>
                    {/* <div className="buttons">
                        {!isLoading ? (<Button type="submit" disabled={isTimeIsUp} className='button'>Enable 2FA</Button>) : (<Button disabled className='button'><Loading /></Button>)}
                    </div> */}
                </form>
            </div>
        </Modal>
    )
}

export default OtpTwoFAModal
