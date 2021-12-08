import './EmailLogin.scss'

import { useState, useEffect } from 'react'
import { MdEmail } from 'react-icons/md'

import { fetch, fetchCaught } from '../../lib/fetch'

import LoginOrSignup from '../LoginOrSignupForm/LoginOrSignupForm'

// NOTE: the same polling that we do here with the setEffect should be used for txns
// that require email confirmation
export default function EmailLogin({ relayerURL, onAddAccount }) {
    const [requiresEmailConfFor, setRequiresConfFor] = useState(null)
    const [err, setErr] = useState('')
    const [inProgress, setInProgress] = useState(false)
  
    const EMAIL_VERIFICATION_RECHECK = 3000
  
    const attemptLogin = async ({ email, passphrase }, ignoreEmailConfirmationRequired) => {
      // try by-email first: if this returns data we can just move on to decrypting
      // does not matter which network we request
      const { resp, body, errMsg } = await fetchCaught(`${relayerURL}/identity/by-email/${encodeURIComponent(email)}`, { headers: {
          authorization: localStorage.loginSessionKey ? `Bearer ${localStorage.loginSessionKey}` : null
      } })
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
        const requestAuthResp = await fetch(`${relayerURL}/identity/by-email/${encodeURIComponent(email)}/request-confirm-login`, { method: 'POST' })
        if (requestAuthResp.status !== 200) {
          setErr(`Email confirmation needed but unable to request: ${requestAuthResp.status}`)
          return
        }
        localStorage.loginSessionKey = (await requestAuthResp.json()).sessionKey
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
        const { _id, salt, identityFactoryAddr, baseIdentityAddr, bytecode } = identityInfo
        const { quickAccSigner, primaryKeyBackup } = identityInfo.meta

        onAddAccount({
          id: _id,
          email: identityInfo.meta.email,
          primaryKeyBackup,
          salt, identityFactoryAddr, baseIdentityAddr, bytecode,
          signer: quickAccSigner
        }, { select: true })

        // Delete the key so that it can't be used anymore on this browser
        delete localStorage.loginSessionKey
      } else {
        setErr(body.message ? `Relayer error: ${body.message}` : `Unknown no-message error: ${resp.status}`)
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
    const importJSONHref = `/#/json-import`

    if (!relayerURL) {
        return (<section className="loginSignupWrapper" id="emailLoginSection">
            <div id="logo"/>
            <h3 class="error">Email login not supported without the relayer.</h3>
            <a href={importJSONHref}><button>Import JSON</button></a>
        </section>)
    }

    const inner = requiresEmailConfFor ?
      (<div id="loginEmail" className="emailConf">
        <h3><MdEmail size={25} color="white"/>Email confirmation required</h3>
        <p>
        We sent an email to {requiresEmailConfFor.email}, please check your inbox and click "<b>Authorize New Device</b>".
        </p>
        {err ? (<p className="error">{err}</p>) : (<></>)}
      </div>)
      : (<div id="loginEmail">
        <LoginOrSignup onAccRequest={onLoginUserAction} inProgress={inProgress}></LoginOrSignup>
        <div className='magicLink'>A password will not be required, we will send a magic login link to your email.</div>
  
        {err ? (<p className="error">{err}</p>) : (<></>)}
  
        {/*<a href={importJSONHref}>Import JSON</a>*/}
      </div>)
      
    return (
      <section className="loginSignupWrapper" id="emailLoginSection">
      <div id="logo"/>
      {inner}
    </section>
    )
  }