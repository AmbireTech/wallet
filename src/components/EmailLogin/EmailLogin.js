import { useState, useEffect } from 'react'
import { MdEmail } from 'react-icons/md'
import { Wallet } from 'ethers'

import { fetch, fetchCaught } from '../../lib/fetch'

import LoginOrSignup from '../LoginOrSignupForm/LoginOrSignupForm'

// NOTE: the same polling that we do here with the setEffect should be used for txns
// that require email confirmation
export default function EmailLogin({ relayerURL, onAddAccount }) {
    const [requiresEmailConfFor, setRequiresConfFor] = useState(null)
    const [err, setErr] = useState('')
  
    const EMAIL_VERIFICATION_RECHECK = 3000
  
    const onTryDecrypt = async (identityInfo, passphrase) => {
      if (!identityInfo.meta.primaryKeyBackup) {
        setErr('No account key backup: you either disabled email login or you have to import it from JSON')
        return
      }
      // @TODO progress bar here
      try {
        const wallet = await Wallet.fromEncryptedJson(JSON.parse(identityInfo.meta.primaryKeyBackup), passphrase)
        // console.log(wallet)
        const { _id, salt, identityFactoryAddr, baseIdentityAddr } = identityInfo
        onAddAccount({
          _id,
          email: identityInfo.meta.email,
          primaryKeyBackup: identityInfo.meta.primaryKeyBackup,
          salt, identityFactoryAddr, baseIdentityAddr
        })
      } catch (e) {
        if (e.message.includes('invalid password')) setErr('Invalid passphrase')
        else {
          setErr(`Unexpected login error: ${e.message}`)
          console.error(e)
        }
      }
    }
  
    const attemptLogin = async ({ email, passphrase }, ignoreEmailConfirmationRequired) => {
      // try by-email first: if this returns data we can just move on to decrypting
      // does not matter which network we request
      const { resp, body, errMsg } = await fetchCaught(`${relayerURL}/identity/by-email/${encodeURIComponent(email)}`, { credentials: 'include' })
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
        setRequiresConfFor({ email, passphrase })
        return
      }
      // If we make it beyond this point, it means no email confirmation will be required
      setRequiresConfFor(null)
  
      if (resp.status === 404 && body.errType === 'DOES_NOT_EXIST') {
        setErr('Account does not exist')
        return
      }
  
      if (resp.status === 200) {
        onTryDecrypt(body, passphrase)
      } else {
        setErr(body.message ? `Relayer error: ${body.message}` : `Unknown no-message error: ${resp.status}`)
      }
    }
  
    const onLoginUserAction = async ({ email, passphrase }) => {
      setErr('')
      setRequiresConfFor('')
      attemptLogin({ email, passphrase })
    }
  
    // try logging in once after EMAIL_VERIFICATION_RECHECK
    useEffect(() => {
      if (requiresEmailConfFor) {
        const timer = setTimeout(() => attemptLogin(requiresEmailConfFor, true), EMAIL_VERIFICATION_RECHECK)
        return () => clearTimeout(timer)
      }
    }, [requiresEmailConfFor, attemptLogin])
  
    const inner = requiresEmailConfFor ?
      (<div id="loginEmail" className="emailConf">
        <h3><MdEmail size={25} color="white"/>Email confirmation required</h3>
        <p>This is the first log-in from this browser, email confirmation is required.<br/><br/>
        We sent an email to {requiresEmailConfFor.email}, please check your inbox and click "Confirm".
        </p>
        {err ? (<p className="error">{err}</p>) : (<></>)}
      </div>)
      : (<div id="loginEmail">
        <LoginOrSignup onAccRequest={onLoginUserAction}></LoginOrSignup>
  
        {err ? (<p className="error">{err}</p>) : (<></>)}
  
        <a href="#">I forgot my passphrase</a>
        <a href="#">Import JSON</a>
      </div>)
      
    return (
      <section className="loginSignupWrapper" id="emailLoginSection">
      <div id="logo"/>
      {inner}
    </section>
    )
  }