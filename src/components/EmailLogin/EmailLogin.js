import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import cn from 'classnames'

import { fetch, fetchCaught } from 'lib/fetch'

import { useLocalStorage } from 'hooks'
import { useThemeContext } from 'context/ThemeProvider/ThemeProvider'
import LoginOrSignup from 'components/LoginOrSignupForm/LoginOrSignupForm'

import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as AmbireLogo } from 'resources/logo.svg'
import styles from './EmailLogin.module.scss'
import AnimationData from './assets/confirm-email.json'

// NOTE: the same polling that we do here with the setEffect should be used for txns
// that require email confirmation
export default function EmailLogin({ relayerURL, onAddAccount }) {
  const { theme } = useThemeContext()
  const [requiresEmailConfFor, setRequiresConfFor] = useState(null)
  const [err, setErr] = useState('')
  const [inProgress, setInProgress] = useState(false)
  const [loginSessionKey, setLoginSessionKey, removeLoginSessionKey] = useLocalStorage({
    key: 'loginSessionKey',
    isStringStorage: true
  })

  const EMAIL_VERIFICATION_RECHECK = 6000

  const attemptLogin = async ({ email, passphrase }, ignoreEmailConfirmationRequired) => {
    // try by-email first: if this returns data we can just move on to decrypting
    // does not matter which network we request
    const { resp, body, errMsg } = await fetchCaught(
      `${relayerURL}/identity/by-email/${encodeURIComponent(email)}`,
      {
        headers: {
          authorization: loginSessionKey ? `Bearer ${loginSessionKey}` : null
        }
      }
    )
    if (errMsg) {
      setErr(errMsg)
      return
    }

    if (resp.status === 401 && body.errType === 'UNAUTHORIZED') {
      if (ignoreEmailConfirmationRequired) {
        // we still have to call this to make sure the state is consistent and to force a re-render (to trigger the effect again)
        setRequiresConfFor({ email, passphrase })
        return
      }
      const requestAuthResp = await fetch(
        `${relayerURL}/identity/by-email/${encodeURIComponent(email)}/request-confirm-login`,
        { method: 'POST' }
      )
      if (requestAuthResp.status !== 200) {
        setErr(`Email confirmation needed but unable to request: ${requestAuthResp.status}`)
        return
      }
      const currentLoginSessionKey = (await requestAuthResp.json()).sessionKey
      setLoginSessionKey(currentLoginSessionKey)
      setRequiresConfFor({ email, passphrase })
      return
    }
    // If we make it beyond this point, it means no email confirmation will be required
    if (resp.status === 404 && body.errType === 'DOES_NOT_EXIST') {
      setRequiresConfFor(null)
      setErr('Account does not exist')
      return
    }

    if (resp.status === 200) {
      const identityInfo = body
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { _id, salt, identityFactoryAddr, baseIdentityAddr, bytecode } = identityInfo
      const { quickAccSigner, primaryKeyBackup } = identityInfo.meta

      onAddAccount(
        {
          id: _id,
          email: identityInfo.meta.email,
          primaryKeyBackup,
          salt,
          identityFactoryAddr,
          baseIdentityAddr,
          bytecode,
          signer: quickAccSigner
        },
        { select: true }
      )

      // Remove the key value so that it can't be used anymore on this browser
      removeLoginSessionKey()
    } else {
      setErr(
        body.message ? `Relayer error: ${body.message}` : `Unknown no-message error: ${resp.status}`
      )
    }
    setRequiresConfFor(null)
  }

  const onLoginUserAction = async ({ email, passphrase }) => {
    setErr('')
    setRequiresConfFor(null)
    setInProgress(true)
    try {
      await attemptLogin({ email, passphrase })
    } catch (e) {
      setErr(`Unexpected error: ${e.message || e}`)
    }
    setInProgress(false)
  }

  // try logging in once after EMAIL_VERIFICATION_RECHECK
  useEffect(() => {
    if (requiresEmailConfFor) {
      const timer = setTimeout(async () => {
        setInProgress(true)
        await attemptLogin(requiresEmailConfFor, true)
        setInProgress(false)
      }, EMAIL_VERIFICATION_RECHECK)
      return () => clearTimeout(timer)
    }
  })

  // @TODO import from JSON; maybe without a URL, as we'll just pop a file selector and then import the JSON
  const importJSONHref = '/#/json-import'

  if (!relayerURL) {
    return (
      <section className={cn(styles.loginSignupWrapper, styles.emailLoginSection, styles[theme])}>
        <div className={styles.logo} />
        <h3 className={styles.error}>Email login not supported without the relayer.</h3>
        <a href={importJSONHref}>
          <button type="button">Import JSON</button>
        </a>
      </section>
    )
  }

  const inner = requiresEmailConfFor ? (
    <div className={`${styles.emailConf}`}>
      <Lottie
        className={styles.emailAnimation}
        animationData={AnimationData}
        background="transparent"
        speed="1"
        loop
        autoplay
      />
      <h3>Email confirmation required</h3>
      <p>
        We sent an email to <span className={styles.email}>{requiresEmailConfFor.email}</span>
        .
        <br />
        Please check your inbox and click
        <br />
        &quot;Authorize New Device&quot;.
      </p>
      {err ? <p className={styles.error}>{err}</p> : null}
    </div>
  ) : (
    <div className={styles.loginEmail}>
      <LoginOrSignup onAccRequest={onLoginUserAction} inProgress={inProgress} />
      <div className={styles.magicLink}>
        A password will not be required, we will send a magic login link to your email.
      </div>
      <a className={styles.backButton} href="#/add-account">
        <ChevronLeftIcon className={styles.backIcon} /> Back to Register
      </a>
      {err ? <p className={styles.error}>{err}</p> : null}

      {/* <a href={importJSONHref}>Import JSON</a> */}
    </div>
  )

  return (
    <section className={cn(styles.loginSignupWrapper, styles.emailLoginSection, styles[theme])}>
      <AmbireLogo className={styles.logo} alt="ambire-logo" />
      {inner}
    </section>
  )
}
