import styles from 'components/AddAccount/AddAccount.module.scss'

import React, { useState, useCallback, useEffect } from 'react'
import { fetchGet } from 'lib/fetch'
import LoginOrSignup from 'components/LoginOrSignupForm/LoginOrSignupForm'
import { AbiCoder, keccak256, id, getAddress } from 'ethers/lib/utils'
import { Wallet } from 'ethers'
import { generateAddress2 } from 'ethereumjs-util'
import { getProxyDeployBytecode } from 'adex-protocol-eth/js/IdentityProxyDeploy'
import { fetchPost } from 'lib/fetch'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { useToasts } from 'hooks/toasts'

export default function AddAccount({ relayerURL, onAddAccount, utmTracking, pluginData }) {
  const [err, setErr] = useState('')
  const [inProgress, setInProgress] = useState(false)
  const [isEmailConfirmed, setEmailConfirmed] = useState(false)
  const [account, setAccount] = useState(null)
  const { addToast } = useToasts()

  const wrapProgress = async (fn, type = true) => {
    setInProgress(type)
    try {
      await fn()
    } catch (e) {
      console.error(e)
    }
    setInProgress(false)
  }

  const createQuickAcc = async (req) => {
    setErr('')

    // async hack to let React run a tick so it can re-render before the blocking Wallet.createRandom()
    await new Promise(resolve => setTimeout(resolve, 0))

    const extraEntropy = id(req.email + ':' + Date.now() + ':' + Math.random() + ':' + (typeof performance === 'object' && performance.now()))
    const firstKeyWallet = Wallet.createRandom({ extraEntropy })
    // 6 words is 2048**6
    const secondKeySecret = Wallet.createRandom({ extraEntropy }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email

    const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
    if (!secondKeyResp.address) throw new Error(`second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`)

    const { salt, baseIdentityAddr, identityFactoryAddr, quickAccManager, quickAccTimelock } = accountPresets
    const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
    const signer = {
      quickAccManager,
      timelock: quickAccountTuple[0],
      one: quickAccountTuple[1],
      two: quickAccountTuple[2]
    }
    const abiCoder = new AbiCoder()
    const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
    const privileges = [[quickAccManager, accHash]]
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddress = getAddress('0x' + generateAddress2(
      // Converting to buffer is required in ethereumjs-util version: 7.1.3
      Buffer.from(identityFactoryAddr.slice(2), 'hex'),
      Buffer.from(salt.slice(2), 'hex'),
      Buffer.from(bytecode.slice(2), 'hex')
    ).toString('hex'))
    const primaryKeyBackup = JSON.stringify(
      await firstKeyWallet.encrypt(req.passphrase, accountPresets.encryptionOpts)
    )

    const utm = utmTracking.getLatestUtmData()

    const createResp = await fetchPost(`${relayerURL}/identity/${identityAddress}`, {
      email: req.email,
      primaryKeyBackup: req.backupOptout ? undefined : primaryKeyBackup,
      secondKeySecret,
      salt, identityFactoryAddr, baseIdentityAddr,
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
      console.log(createResp)
      setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
      return
    }

    setAccount({
      id: identityAddress,
      email: req.email,
      primaryKeyBackup,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer,
      cloudBackupOptout: !!req.backupOptout,
      // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
      backupOptout: !!req.backupOptout,
      // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
      emailConfRequired: true
    })
  }

  const checkEmailConfirmation = useCallback(async () => {
    try {
      const relayerIdentityURL = `${relayerURL}/identity/${account.id}`
      const identity = await fetchGet(relayerIdentityURL)
      if (identity) {
          const { emailConfirmed } = identity.meta
          const isConfirmed = !!emailConfirmed
          setEmailConfirmed(isConfirmed)

          if (isConfirmed) {
            onAddAccount(account, { select: true, isNew: true })

            window.parent.postMessage({
              address: account.id,
              type: 'registrationSuccess',
            }, '*')
          }
      }
    } catch(e) {
      console.error(e);
      addToast('Could not check email confirmation.', { error: true })
    }
  }, [relayerURL, addToast, account, onAddAccount])

  useEffect(() => {
    if (!account) return
    !isEmailConfirmed && checkEmailConfirmation()
    const emailConfirmationInterval = setInterval(() => !isEmailConfirmed && checkEmailConfirmation(), 3000)
    return () => clearInterval(emailConfirmationInterval)
  }, [isEmailConfirmed, checkEmailConfirmation, account])

  return (
    <div className={styles.loginSignupWrapper}>
      <div className={styles.logo} {...(pluginData ? {style: {backgroundImage: `url(${pluginData.iconUrl})` }} : {})}/>
      {pluginData &&
      <div className={styles.pluginInfo}>
        <div className={styles.name}>{pluginData.name}</div>
        <div>{pluginData.description}</div>
      </div>
      }
      <section className={styles.addAccount}>
        <div className={styles.loginEmail}>
        {
          !account ?
            <>
              <h3>Create a new account</h3>
              <LoginOrSignup
                inProgress={inProgress === 'email'}
                onAccRequest={req => wrapProgress(() => createQuickAcc(req), 'email')}
                action="SIGNUP"
              ></LoginOrSignup>
              {err ? (<p className={styles.error}>{err}</p>) : (<></>)}
            </>
          :
            <div>
              <p>Please confirm your email</p>
            </div>
        }
        </div>
      </section>
    </div>
  )
}
