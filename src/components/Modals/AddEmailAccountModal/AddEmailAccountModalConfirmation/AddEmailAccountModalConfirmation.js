import { useState, useCallback, useEffect } from 'react'
import { Button } from 'components/common'
import { FaEnvelope } from 'react-icons/fa'
import { fetchGet, fetchCaught } from 'lib/fetch'
import { MdCheck } from 'react-icons/md'

const EMAIL_RESEND_DELAY = 30 * 1000

const AddEmailAccountModalConfirmation = ({
  relayerURL,
  setModalButtons,
  setError,
  email,
  selectedAcc,
  setStepIndex,
  setIdentityData
}) => {

  const [confirmationEmailResentTimestamp, setConfirmationEmailResentTimestamp] = useState(new Date().getTime())
  const [ticker, setTicker] = useState(0)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setTicker(new Date().getTime())

      const identityUrl = `${relayerURL}/identity/${selectedAcc.id}`
      fetchGet(identityUrl)
        .then(result => {
            if (result.meta?.emailConfirmed && !isEmailConfirmed) {
              setIdentityData(result)
            }
            setIsEmailConfirmed(result.meta?.emailConfirmed)
          }
        )
        .catch(err => {
          console.error('Could not get identity data: ' + err.message)
        })

    }, 1000)
  }, [ticker, relayerURL, selectedAcc, setIdentityData, isEmailConfirmed])

  const onConfirm = useCallback(() => {
    setStepIndex(2)
  }, [setStepIndex])

  useEffect(() => {
    setModalButtons(<>
      <Button small className={'full'} icon={<MdCheck/>} onClick={onConfirm}
              disabled={!isEmailConfirmed}>Continue</Button>
    </>)
  }, [isEmailConfirmed, onConfirm, setModalButtons])

  const resendConfirmationEmail = async () => {
    setError(null)
    try {
      const response = await fetchCaught(`${relayerURL}/identity/${selectedAcc.id}/resend-verification-email`)
      if (response.resp.status === 200) {
        if (!response.body.success) {
          setError('Could not send verification email', { error: true })
        } else {
          setConfirmationEmailResentTimestamp(new Date().getTime())
        }
      } else if (response.resp.status === 429) {
        setError('Please wait before resending confirmation email')
      } else {
        setError('Could not send verification email: ' + response.resp.status)
      }
    } catch (e) {
      setError('Could not send verification email: ' + e.message, { error: true })
    }
  }

  const resendThrottleTime = Math.floor((EMAIL_RESEND_DELAY - (new Date().getTime() - confirmationEmailResentTimestamp)) / 1000)

  return (<>
    <div className={'notification-hollow info confirmation-message'}>
      <FaEnvelope/>
      <div>
        An email has been sent to {email}.<br/>
        Please confirm the email to continue.
      </div>
    </div>

    {
      <div className='info-panel mt-4'>

        <div className={'resend-email'}>
          {
            isEmailConfirmed
              ? (
                <span>Email successfully confirmed!</span>
              )
              : (<>
              <span>
                Waiting for confirmation...<br/>
                <br/>
                Did not receive the confirmation email?
              </span>
                {
                  resendThrottleTime > 0 && <span>Please wait {resendThrottleTime} secs to send the confirmation email again</span>
                }
                <Button className={'resendEmailButton'} secondary disabled={resendThrottleTime > 0}
                        onClick={resendConfirmationEmail}>Resend email</Button>
              </>)
          }
        </div>
      </div>
    }


  </>)

}

export default AddEmailAccountModalConfirmation
