import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import cn from 'classnames'

import { fetch, fetchCaught, fetchPost } from 'lib/fetch'
import { AbiCoder, keccak256, id, getAddress } from 'ethers/lib/utils'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { getProxyDeployBytecode } from 'adex-protocol-eth/js/IdentityProxyDeploy'
import { generateAddress2 } from 'ethereumjs-util'
import { useLocalStorage } from 'hooks'
import { useThemeContext } from 'context/ThemeProvider/ThemeProvider'
import LoginOrSignup from 'components/LoginOrSignupForm/LoginOrSignupForm'
import { Button } from 'components/common'

import { Wallet } from 'ethers'

import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as AmbireLogo } from 'resources/logo.svg'
import styles from './EmailLogin.module.scss'
import AnimationData from './assets/confirm-email.json'

const RESEND_EMAIL_TIMER_INITIAL = 60000

// NOTE: the same polling that we do here with the setEffect should be used for txns
// that require email confirmation
export default function EmailLogin({ utmTracking, relayerURL, onAddAccount, isRegister }) {
  const { theme } = useThemeContext()
  const [requiresEmailConfFor, setRequiresConfFor] = useState(null)
  const [err, setErr] = useState('')
  const [inProgress, setInProgress] = useState(false)
  const [isCreateRespCompleted, setIsCreateRespCompleted] = useState(null)
  const [resendTimeLeft, setResendTimeLeft] = useState(null)
  const [addAccErr, setAddAccErr] = useState('')

  const [loginSessionKey, setLoginSessionKey, removeLoginSessionKey] = useLocalStorage({
    key: 'loginSessionKey',
    isStringStorage: true
  })

  const wrapProgress = async (fn, type = true) => {
    setInProgress(type)
    try {
      await fn()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
    setInProgress(false)
  }

  const createQuickAcc = async (req) => {
    setErr('')

    // async hack to let React run a tick so it can re-render before the blocking Wallet.createRandom()
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 0))

    const extraEntropy = id(
      `${req.email}:${Date.now()}:${Math.random()}:${
        typeof performance === 'object' && performance.now()
      }`
    )
    const firstKeyWallet = Wallet.createRandom({ extraEntropy })
    // 6 words is 2048**6
    const secondKeySecret = `${Wallet.createRandom({ extraEntropy })
      .mnemonic.phrase.split(' ')
      .slice(0, 6)
      .join(' ')} ${req.email}`

    const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
    if (!secondKeyResp.address)
      throw new Error(
        `second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`
      )

    const { salt, baseIdentityAddr, identityFactoryAddr, quickAccManager, quickAccTimelock } =
      accountPresets
    const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
    const signer = {
      quickAccManager,
      timelock: quickAccountTuple[0],
      one: quickAccountTuple[1],
      two: quickAccountTuple[2]
    }
    const abiCoder = new AbiCoder()
    const accHash = keccak256(
      abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple])
    )
    const privileges = [[quickAccManager, accHash]]
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress(
      `0x${generateAddress2(
        // Converting to buffer is required in ethereumjs-util version: 7.1.3
        Buffer.from(identityFactoryAddr.slice(2), 'hex'),
        Buffer.from(salt.slice(2), 'hex'),
        Buffer.from(bytecode.slice(2), 'hex')
      ).toString('hex')}`
    )
    const primaryKeyBackup = JSON.stringify(
      await firstKeyWallet.encrypt(req.passphrase, accountPresets.encryptionOpts)
    )

    const utm = utmTracking.getLatestUtmData()

    const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
      email: req.email,
      primaryKeyBackup: req.backupOptout ? undefined : primaryKeyBackup,
      secondKeySecret,
      salt,
      identityFactoryAddr,
      baseIdentityAddr,
      privileges,
      quickAccSigner: signer,
      ...(utm.length && { utm })
    })

    if (createResp.success) {
      utmTracking.resetUtm()
    }
    if (createResp.message === 'EMAIL_ALREADY_USED') {
      setErr('An account with this email already exists')
      return
    }
    if (!createResp.success) {
      // eslint-disable-next-line no-console
      console.log(createResp)
      setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
      return
    }

    setIsCreateRespCompleted([
      {
        id: identityAddr,
        email: req.email,
        primaryKeyBackup,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer,
        cloudBackupOptout: !!req.backupOptout,
        // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
        backupOptout: !!req.backupOptout,
        // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
        emailConfRequired: true
      },
      { select: true, isNew: true }
    ])

    setRequiresConfFor(true)
    setResendTimeLeft(RESEND_EMAIL_TIMER_INITIAL)
  }
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
      {isRegister ? (
        <>
          <LoginOrSignup
            inProgress={inProgress === 'email'}
            onAccRequest={(req) => wrapProgress(() => createQuickAcc(req), 'email')}
            action="SIGNUP"
          />
          <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>
            Already have an account?{' '}
            <a style={{ fontSize: '1.75rem' }} href="#/email-login">
              Login
            </a>
          </div>
        </>
      ) : (
        <>
          <LoginOrSignup onAccRequest={onLoginUserAction} inProgress={inProgress} action="LOGIN" />
          <div className={styles.magicLink}>
            A password will not be required, we will send a magic login link to your email.
          </div>
        </>
      )}
      <a className={styles.backButton} href="#/add-account">
        <ChevronLeftIcon className={styles.backIcon} /> Back to Add account
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
