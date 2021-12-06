import { useState, useRef } from 'react'
import { Button, Loading, TextInput } from '../common'
import { isTokenEligible } from './helpers'

export default function Actions({ estimation, feeSpeed, approveTxn, rejectTxn, signingStatus }) {
  const [quickAccCredentials, setQuickAccCredentials] = useState({ code: '', passphrase: '' })
  const form = useRef(null)

  const rejectButton = rejectTxn && (
    <Button small danger className='rejectTxn' onClick={rejectTxn}>Reject</Button>
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
    (<><Loading/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signing...</>)
    : (<>Sign and send</>)

  const isRecoveryMode = signingStatus && signingStatus.finalBundle && signingStatus.finalBundle.recoveryMode
  if (signingStatus && signingStatus.quickAcc) {
    return (<>
      <div>
        {signingStatus.confCodeRequired === 'otp' ? (<b>Please enter your OTP code and your password.</b>) : (<></>)}
        {signingStatus.confCodeRequired === 'email' ? (<b>A confirmation code was sent to your email, please enter it along with your password.</b>) : (<></>)}
      </div>
      {<TextInput
        small
        password
        required
        minLength={3}
        placeholder='Password'
        value={quickAccCredentials.passphrase}
        style={isRecoveryMode ? { visibility: 'hidden' } : {} }
        disabled={isRecoveryMode}
        onChange={value => setQuickAccCredentials({ ...quickAccCredentials, passphrase: value })}
      ></TextInput>}
      <form ref={form} className='quickAccSigningForm' onSubmit={e => { e.preventDefault() }}>
        {/* Changing the autoComplete prop to a random string seems to disable it in more cases */}
        <TextInput
          small
          pattern='[0-9]+'
          title='Confirmation code should be 6 digits'
          autoComplete='nope'
          required minLength={6} maxLength={6}
          placeholder='Confirmation code'
          value={quickAccCredentials.code}
          onChange={value => setQuickAccCredentials({ ...quickAccCredentials, code: value })}
        ></TextInput>
        {rejectButton}
        <Button small className='approveTxn'
          onClick={() => {
            if (!form.current.checkValidity()) return
            approveTxn({ quickAccCredentials })
          }}
        >
          {signButtonLabel}
        </Button>
      </form>
    </>)
  }

  return (<div className='buttons'>
      {rejectButton}
      <Button small className='approveTxn' disabled={!estimation || signingStatus} onClick={approveTxn}>
        {signButtonLabel}
      </Button>
  </div>)
}
