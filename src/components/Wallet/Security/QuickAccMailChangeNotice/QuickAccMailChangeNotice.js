import { fetchGet, fetchCaught } from 'lib/fetch'
import { useState, useEffect, useCallback } from 'react'
import { accHash } from 'lib/quickaccUtils'
import { createQuickaccPrivilegeUpdateBundle } from 'lib/quickaccUtils'
import { FaExclamationTriangle } from 'react-icons/fa'
import { Button } from 'components/common'

const REFRESH_INTVL = 40 * 1000
const EMAIL_RESEND_DELAY = 30 * 1000

const QuickAccMailChangeNotice = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  showSendTxns
}) => {

  const [confirmationEmailResentTimestamp, setConfirmationEmailResentTimestamp] = useState(0)

  const [isEmailConfirmed, setIsEmailConfirmed] = useState(null)
  const [isQuickAccSynced, setIsQuickAccSynced] = useState(null)
  const [error, setError] = useState(null)
  const [identityData, setIdentityData] = useState(null)
  const [privileges, setPrivileges] = useState(null)

  const [emailCheckInterval, setEmailCheckInterval] = useState(30 * 1000)

  const [privilegesCacheBreak, setPrivilegesCacheBreak] = useState(() => Date.now())
  const [emailConfirmationCacheBreak, setEmailConfirmationCacheBreak] = useState(() => Date.now())

  const privilegesUrl = `${relayerURL}/identity/${selectedAcc.id}/${selectedNetwork.id}/privileges?cacheBreak=${privilegesCacheBreak}&fromNotice`
  const resendEmailConfirmationUrl = `${relayerURL}/identity/${selectedAcc.id}/resend-verification-email?fromNotice`
  const checkEmailConfirmationUrl = `${relayerURL}/identity/${selectedAcc.id}?fromNotice`

  const resendConfirmationEmail = async () => {
    setError(null)
    try {
      const response = await fetchCaught(resendEmailConfirmationUrl)
      if (response.resp.status === 200) {
        if (!response.body.success) {
          setError('Could not send verification email')
        } else {
          setConfirmationEmailResentTimestamp(new Date().getTime())
          setEmailCheckInterval(1 * 1000)
        }
      } else if (response.resp.status === 429) {
        setError('Please wait some time before requesting another email confirmation')
        setConfirmationEmailResentTimestamp(new Date().getTime())
      } else {
        setError('Could not resend verification email:' + response.status)
      }

    } catch (e) {
      setError('Could not send verification email: ' + e.message)
    }
  }

  const finalizeQuickAccPrivilegeOnChain = useCallback(async () => {
    const bundle = createQuickaccPrivilegeUpdateBundle(
      {
        accountAddress: identityData._id,
        networkId: selectedNetwork.id,
        currentSigner: selectedAcc.signer,
        newQuickAccSigner: identityData.meta.quickAccSigner,
      }
    )

    showSendTxns(bundle, true)
  }, [selectedAcc, selectedNetwork, identityData, showSendTxns])

  useEffect(() => {
    if (isEmailConfirmed) return
    fetchGet(checkEmailConfirmationUrl)
      .then(result => {
          setIdentityData(result)
          setIsEmailConfirmed(!!result.meta?.emailConfirmed)
        }
      )
      .catch(err => {
        console.error('Could not get identity data: ' + err.message)
      })
  }, [checkEmailConfirmationUrl, emailConfirmationCacheBreak, isEmailConfirmed])

  useEffect(() => {
    if (privileges === null) return
    if (identityData === null) return
    if (identityData.meta?.quickAccSigner) {
      const hash = accHash(identityData.meta.quickAccSigner)
      if (privileges[identityData.meta?.quickAccSigner.quickAccManager] === hash) {
        setIsQuickAccSynced(true)
      } else {
        setIsQuickAccSynced(false)
      }
    } else {
      setIsQuickAccSynced(false)
    }
  }, [privileges, identityData])

  useEffect(() => {
    if (Date.now() - privilegesCacheBreak > REFRESH_INTVL) setPrivilegesCacheBreak(Date.now())
    const intvl = setTimeout(() => setPrivilegesCacheBreak(Date.now()), REFRESH_INTVL)
    return () => clearTimeout(intvl)
  }, [privilegesCacheBreak])

  useEffect(() => {

    if (EMAIL_RESEND_DELAY - (new Date().getTime() - confirmationEmailResentTimestamp) <= 0 && emailCheckInterval < 30 * 1000) {
      setEmailCheckInterval(30 * 1000)
      return
    }

    const handler = setTimeout(() => setEmailConfirmationCacheBreak(Date.now()), emailCheckInterval)
    return () => clearTimeout(handler)
  }, [confirmationEmailResentTimestamp, emailCheckInterval, emailConfirmationCacheBreak])

  useEffect(() => {
    // TODO useRelayerData?
    fetchGet(privilegesUrl)
      .then(result => {
        setPrivileges(result.privileges)
      })
      .catch(err => {
        setError('could not fetch privileges')
      })
  }, [privilegesUrl])

  useEffect(() => {
    setPrivileges(null)
    setIsEmailConfirmed(null)
    setIsQuickAccSynced(null)
    setIdentityData(null)
  }, [selectedAcc, selectedNetwork])

  if (isEmailConfirmed === false) {

    const resendDelay = Math.floor((EMAIL_RESEND_DELAY - (new Date().getTime() - confirmationEmailResentTimestamp)) / 1000)

    return <>
      <div className={'email-account-change'}>
        <FaExclamationTriangle/>
        {error}
        <div className={'email-account-change-desc'}>
          <span className={'email-account-change-title'}>An email account update has been initiated.</span>
          {
            resendDelay > 0
              ? <span>An confirmation email has been sent to the provided email. If you did not receive the email, you can retry in {resendDelay} secs</span>
              : <span>Please check your emails and click on the link to confirm it and continue the process</span>
          }
          <Button small onClick={resendConfirmationEmail} disabled={resendDelay > 0}>
            Resend email
          </Button>
        </div>
      </div>
    </>
  } else if (isQuickAccSynced === false) {
    return (
      <div className={'email-account-change'}>
        <FaExclamationTriangle/>
        {error}
        <div className={'email-account-change-desc'}>
          <span className={'email-account-change-title'}>An email account update has been initiated.</span>
          To finalize the update on {selectedNetwork.id} you need to sync the change on-chain. Update will be effective
          once the transaction is mined.
        </div>
        <Button small onClick={finalizeQuickAccPrivilegeOnChain}>
          Finalize change
        </Button>
      </div>
    )
  }

  return <></>

}

export default QuickAccMailChangeNotice
