import { useState, useRef, useEffect } from 'react'
import { Button, Loading, TextInput } from 'components/common'
import { isTokenEligible } from './helpers'
import { MdCheck, MdCheckCircle, MdOutlineCheck, MdOutlineClose } from 'react-icons/md'

export default function Actions({ estimation, feeSpeed, approveTxn, rejectTxn, cancelSigning, signingStatus }) {
  const [quickAccCredentials, setQuickAccCredentials] = useState({ code: '', passphrase: '' })
  // reset this every time the signing status changes
  useEffect(() => !signingStatus && setQuickAccCredentials(prev => ({ ...prev, code: '' })), [signingStatus])

  const form = useRef(null)

  const rejectButton = rejectTxn && (
    // WARNING: DO NOT remove type='button' here, it indicates that this button is not a submit button in the <form>
    // if it is, pressing Enter will reject the transaction rather than submit it
    <Button danger icon={<MdOutlineClose/>} type='button' className='rejectTxn' onClick={rejectTxn}>Reject</Button>
  )
  const insufficientFee = estimation && estimation.feeInUSD
    && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation)
  const willFail = (estimation && !estimation.success) || insufficientFee
  if (willFail) {
    return (<div className='buttons'>
      {rejectButton}
    </div>)
  }

  const signButtonLabel = signingStatus && signingStatus.inProgress ?
    <><Loading/>Signing...</>
    : <><MdOutlineCheck/>Sign and send</>

  const isRecoveryMode = signingStatus && signingStatus.finalBundle && signingStatus.finalBundle.recoveryMode
  if (signingStatus && signingStatus.quickAcc) {
    return (<>
      {
        signingStatus.confCodeRequired ?
          <div className='confirmation-code-info'>
            <div className='confirmation-code-info-title'><MdCheckCircle/>Confirmation</div>
            <div className='confirmation-code-info-message'>
              {signingStatus.confCodeRequired === 'otp' ? <>Please enter your OTP code and your password.</> : null}
              {signingStatus.confCodeRequired === 'email' ? <>A confirmation code was sent to your email, please enter it along with your password.</> : null}
            </div>
          </div>
          :
          null
      }
  
      <form ref={form} className='quickAccSigningForm' onSubmit={e => { e.preventDefault() }}>
        <div className='inputs-container'>
          <TextInput
            small
            password
            required
            minLength={3}
            placeholder='Password'
            value={quickAccCredentials.passphrase}
            style={isRecoveryMode ? { visibility: 'hidden' } : {} }
            disabled={isRecoveryMode}
            onChange={value => setQuickAccCredentials({ ...quickAccCredentials, passphrase: value })}
          ></TextInput>
          {/* Changing the autoComplete prop to a random string seems to disable it in more cases */}
          <TextInput
            small
            pattern='[0-9]+'
            title='Confirmation code should be 6 digits'
            autoComplete='nope'
            required minLength={6} maxLength={6}
            placeholder={signingStatus.confCodeRequired === 'otp' ? 'Authenticator OTP code' : 'Confirmation code'}
            value={quickAccCredentials.code}
            onChange={value => setQuickAccCredentials({ ...quickAccCredentials, code: value })}
          ></TextInput>
        </div>
        <div className='buttons'>
          <Button
            clear
            disabled={signingStatus && signingStatus.inProgress}
            icon={<MdOutlineClose/>}
            type='button'
            className='cancelSigning'
            onClick={cancelSigning}
          >
            Cancel
          </Button>
          <Button 
            className='confirmSigning'
            onClick={() => {
              if (!form.current.checkValidity()) return
              approveTxn({ quickAccCredentials })
            }}
          >
            { signingStatus && signingStatus.inProgress ? <Loading/> : <><MdCheck/> Confirm</>}
          </Button>
        </div>
      </form>
    </>)
  }

  return (<div className='buttons'>
      {rejectButton}
      <Button className='approveTxn' disabled={!estimation || signingStatus} onClick={approveTxn}>
        {signButtonLabel}
      </Button>
  </div>)
}
