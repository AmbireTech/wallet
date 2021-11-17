import { useState, useRef } from 'react'
import { Loading } from '../common'
import { isTokenEligible } from './helpers'

export default function Actions({ estimation, feeSpeed, approveTxn, rejectTxn, signingStatus }) {
  const [quickAccCredentials, setQuickAccCredentials] = useState({ code: '', passphrase: '' })
  const form = useRef(null)

  const rejectButton = rejectTxn && (
    <button type='button' className='rejectTxn' onClick={rejectTxn}>Reject</button>
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

  if (signingStatus && signingStatus.quickAcc) {
    return (<>
      <div>
        {signingStatus.confCodeRequired === 'otp' ? (<b>Please enter your OTP code and your passphrase.</b>) : (<></>)}
        {signingStatus.confCodeRequired === 'email' ? (<b>A confirmation code was sent to your email, please enter it along with your passphrase.</b>) : (<></>)}
      </div>
      <input type='password' required minLength={8} placeholder='Passphrase' value={quickAccCredentials.passphrase} onChange={e => setQuickAccCredentials({ ...quickAccCredentials, passphrase: e.target.value })}></input>
      <form ref={form} className='quickAccSigningForm' onSubmit={e => { e.preventDefault() }}>
        {/* Changing the autoComplete prop to a random string seems to disable it more often */}
        <input
          type='text' pattern='[0-9]+'
          title='Confirmation code should be 6 digits'
          autoComplete='nope'
          required minLength={6} maxLength={6}
          placeholder='Confirmation code'
          value={quickAccCredentials.code}
          onChange={e => setQuickAccCredentials({ ...quickAccCredentials, code: e.target.value })}
        ></input>
        {rejectButton}
        <button className='approveTxn'
          onClick={() => {
            if (!form.current.checkValidity()) return
            approveTxn({ quickAccCredentials })
          }}
        >
          {signButtonLabel}
        </button>
      </form>
    </>)
  }

  return (<div className='buttons'>
      {rejectButton}
      <button className='approveTxn' disabled={!estimation || signingStatus} onClick={approveTxn}>
        {signButtonLabel}
      </button>
  </div>)
}
