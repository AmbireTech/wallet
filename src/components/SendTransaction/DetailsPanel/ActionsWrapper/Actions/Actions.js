import { useState, useRef, useEffect, useCallback } from 'react'
import { Wallet, ethers } from 'ethers'
import { AbiCoder, Interface } from 'ethers/lib/utils'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { Bundle } from 'adex-protocol-eth/js'
import cn from 'classnames'

import { getWallet } from 'lib/getWallet'
import { fetchPost } from 'lib/fetch'
import { getProvider } from 'ambire-common/src/services/provider'

import { useToasts } from 'hooks/toasts'
import { Button, TextInput } from 'components/common'
import { isTokenEligible, getFeesData, toHexAmount } from 'components/SendTransaction/helpers'
import { sendNoRelayer } from 'components/SendTransaction/noRelayer'

import styles from './Actions.module.scss'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

function getErrorMessage(e) {
  if (e && e.message === 'NOT_TIME') {
    return "Your 72 hour recovery waiting period still hasn't ended. You will be able to use your account after this lock period."
  }
  if (e && e.message === 'WRONG_ACC_OR_NO_PRIV') {
    return 'Unable to sign with this email/password account. Please contact support.'
    // NOTE: is INVALID_SIGNATURE even a real error?
  }
  if (e && e.message === 'INVALID_SIGNATURE') {
    return 'Invalid signature. This may happen if you used password/derivation path on your hardware wallet.'
  }
  if (e && e.message === 'INSUFFICIENT_PRIVILEGE') {
    return 'Wrong signature. This may happen if you used password/derivation path on your hardware wallet.'
  }
  return e.message || e
}

const Actions = ({
  signingStatus,
  setSigningStatus,
  account,
  bundle,
  isMounted,
  onDismiss,
  network,
  relayerURL,
  estimation,
  feeSpeed,
  isInt,
  replaceTx,
  cancelSigning,
  rejectTxn,
  isGasTankEnabled,
  currentAccGasTankState,
  onBroadcastedTxn,
  resolveMany,
  requestPendingState
}) => {
  const { addToast } = useToasts()
  const [quickAccCredentials, setQuickAccCredentials] = useState({ code: '', passphrase: '' })
  // reset this every time the signing status changes
  useEffect(
    () => !signingStatus && setQuickAccCredentials((prev) => ({ ...prev, code: '' })),
    [signingStatus]
  )

  const form = useRef(null)

  const rejectButton = rejectTxn && (
    // WARNING: DO NOT remove type='button' here, it indicates that this button is not a submit button in the <form>
    // if it is, pressing Enter will reject the transaction rather than submit it
    <Button
      variant="danger"
      type="button"
      className={cn(styles.button, styles.danger)}
      onClick={rejectTxn}
    >
      Reject
    </Button>
  )

  const approveTxn = ({ quickAccCredentials }) => {
    if (signingStatus && signingStatus.inProgress) return
    setSigningStatus(signingStatus || { inProgress: true })

    if (account.signerExtra && account.signerExtra.type === 'ledger') {
      addToast('Please confirm this transaction on your Ledger device.', {
        timeout: 10000
      })
    }

    if (account.signerExtra && account.signerExtra.type === 'Lattice') {
      addToast('Please confirm this transaction on your Lattice device.', {
        timeout: 10000
      })
    }

    const requestIds = bundle.requestIds
    const approveTxnPromise = bundle.signer.quickAccManager
      ? approveTxnImplQuickAcc({ quickAccCredentials })
      : approveTxnImpl()
    approveTxnPromise
      .then((bundleResult) => {
        requestPendingState.current = true
        // special case for approveTxnImplQuickAcc: when a user interaction prevents the operation from completing
        if (!bundleResult) return

        // do not to call this after onDimiss, cause it might cause state to be changed post-unmount
        if (isMounted.current) setSigningStatus(null)

        // Inform everything that's waiting for the results (eg WalletConnect)
        const skipResolve =
          !bundleResult.success &&
          bundleResult.message &&
          bundleResult.message.match(/underpriced/i)
        if (!skipResolve && requestIds)
          resolveMany(requestIds, {
            success: bundleResult.success,
            result: bundleResult.txId,
            message: bundleResult.message
          })

        if (bundleResult.success) {
          onBroadcastedTxn(bundleResult.txId)
          onDismiss()
        } else {
          // to force replacementBundle to be null, so it's not filled from previous state change in App.js in useEffect
          // basically close the modal if the txn was already mined
          if (bundleResult.message.includes('was already mined')) {
            onDismiss()
          }
          addToast(`Transaction error: ${getErrorMessage(bundleResult)}`, {
            error: true
          }) // 'unspecified error'
        }
      })
      .catch((e) => {
        if (isMounted.current) setSigningStatus(null)
          console.error(e)
        if(!e || !e.message) {
          addToast(`Signing error: Unknown error`, { error: true })
        } else if (
          e.message.includes('must provide an Ethereum address') ||
          // used for ambire extension
          e.message.includes('must use the current user address to sign')
        ){
          addToast(
            `Signing error: not connected with the correct address. Make sure you're connected with ${bundle.signer.address}.`,
            { error: true }
          )
        } else if (e.message.includes('0x6b0c')) {
          // not sure if that's actually the case with this hellish error, but after unlocking the device it no longer appeared
          // however, it stopped appearing after that even if the device is locked, so I'm not sure it's related...
          addToast(
            'Ledger: unknown error (0x6b0c): is your Ledger unlocked and in the Ethereum application?',
            { error: true }
          )
        } else {
          addToast(`Signing error: ${getErrorMessage(e)}`, { error: true })
        }
      })
  }

  const approveTxnImpl = async () => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    const provider = getProvider(network.id)
    const signer = finalBundle.signer

    // a bit redundant cause we already called it at the beginning of approveTxn, but
    // we need to freeze finalBundle in the UI in case signing takes a long time (currently only to freeze the fee selector)
    setSigningStatus({ inProgress: true, finalBundle })

    const wallet = getWallet({
      signer,
      signerExtra: account.signerExtra,
      chainId: network.chainId
    })

    if (
      wallet.isUnlocked && !(await wallet.isUnlocked())
    )
      addToast(
        'Please unlock or connect your Web3 wallet before proceeding with signing this transaction.',
        { warning: true }
      )
    if(wallet.web3eth_requestAccounts){
      const TIME_TO_UNLOCK = 30 * 1000
      let tooLateToUnlock = false
      const timeout = setTimeout(() => {
        tooLateToUnlock = true
      }, TIME_TO_UNLOCK)
      // prompts the user to unlock extension
      await wallet.web3eth_requestAccounts()
      if (tooLateToUnlock) throw new Error('Too slow to unlock web3 wallet')
      clearTimeout(timeout)
    }
    
    if (relayerURL) {
      // Temporary way of debugging the fee cost
      // const initialLimit = finalBundle.gasLimit - getFeePaymentConsequences(estimation.selectedFeeToken, estimation).addedGas
      // finalBundle.estimate({ relayerURL, fetch }).then(estimation => console.log('fee costs: ', estimation.gasLimit - initialLimit), estimation.selectedFeeToken).catch(console.error)
      await finalBundle.sign(wallet)
      return await finalBundle.submit({ relayerURL, fetch })
    }
    return sendNoRelayer({
      finalBundle,
      account,
      network,
      wallet,
      estimation,
      feeSpeed,
      provider
    })
  }

  const getFinalBundle = useCallback(() => {
    if (!relayerURL) {
      return new Bundle({
        ...bundle,
        gasLimit: estimation.gasLimit
      })
    }

    const feeToken = estimation.selectedFeeToken

    const {
      feeInNative,
      // feeInUSD, // don't need fee in USD for stables as it will work with feeInFeeToken
      // Also it can be stable but not in USD
      feeInFeeToken,
      addedGas
    } = getFeesData(feeToken, estimation, feeSpeed, currentAccGasTankState.isEnabled, network)
    const feeTxn =
      feeToken.symbol === network.nativeAssetSymbol
        ? // TODO: check native decimals
          [accountPresets.feeCollector, toHexAmount(feeInNative, 18), '0x']
        : [
            feeToken.address,
            '0x0',
            ERC20.encodeFunctionData('transfer', [
              accountPresets.feeCollector,
              toHexAmount(feeInFeeToken, feeToken.decimals)
            ])
          ]

    const nextFreeNonce = estimation.nextNonce?.nonce
    const nextNonMinedNonce = estimation.nextNonce?.nextNonMinedNonce
    // If we've passed in a bundle, use it's nonce (when using a replacementBundle); else, depending on whether we want to replace the current pending bundle,
    // either use the next non-mined nonce or the next free nonce
    const nonce = isInt(bundle.nonce) ? bundle.nonce : replaceTx ? nextNonMinedNonce : nextFreeNonce

    if (currentAccGasTankState.isEnabled) {
      let gasLimit
      if (bundle.txns.length > 1) gasLimit = estimation.gasLimit + (bundle.extraGas || 0)
      else gasLimit = estimation.gasLimit

      let value
      if (feeToken.address === '0x0000000000000000000000000000000000000000') value = feeInNative
      else {
        const fToken = estimation.remainingFeeTokenBalances.find((i) => i.id === feeToken.id)
        value = fToken && estimation.feeInNative[feeSpeed] * fToken.nativeRate
      }

      const lastTxn = bundle.txns[bundle.txns.length - 1]
      const abiCoder = new AbiCoder()
      const gasTankValue = ethers.utils
        .parseUnits(value.toFixed(feeToken.decimals), feeToken.decimals)
        .toString()

      try {
        // if the decode works and the first value is gasTank,
        // it means it is the gas tank txn. If so, delete it
        const result = abiCoder.decode(['string', 'uint256', 'string'], lastTxn[2])
        if (result[0] === 'gasTank') {
          bundle.txns.pop()
        }
      } catch (e) {
        // all's good
      }

      // add the gas tank transaction
      // since it calls the relayer, it consumes only an extra 295 gas
      // the data is the encoded gas tank parameters
      bundle.txns.push([
        accountPresets.feeCollector,
        '0',
        abiCoder.encode(['string', 'uint256', 'string'], ['gasTank', gasTankValue, feeToken.id])
      ])

      return new Bundle({
        ...bundle,
        txns: [...bundle.txns],
        gasLimit,
        nonce
      })
    }

    return new Bundle({
      ...bundle,
      txns: [...bundle.txns, feeTxn],
      gasTankFee: null,
      gasLimit: estimation.gasLimit + addedGas + (bundle.extraGas || 0),
      nonce
    })
  }, [
    relayerURL,
    estimation,
    feeSpeed,
    currentAccGasTankState.isEnabled,
    network,
    bundle,
    replaceTx,
    isInt
  ])

  const approveTxnImplQuickAcc = async ({ quickAccCredentials }) => {
    if (!estimation) throw new Error('no estimation: should never happen')
    if (!relayerURL)
      throw new Error('Email/Password account signing without the relayer is not supported yet')

    const finalBundle = (signingStatus && signingStatus.finalBundle) || getFinalBundle()
    const signer = finalBundle.signer

    const canSkip2FA = signingStatus && signingStatus.confCodeRequired === 'notRequired'
    const { signature, success, message, confCodeRequired } = await fetchPost(
      `${relayerURL}/second-key/${bundle.identity}/${network.id}/sign`,
      {
        signer,
        txns: finalBundle.txns,
        nonce: finalBundle.nonce,
        gasLimit: finalBundle.gasLimit,
        ...(!canSkip2FA && {
          code: quickAccCredentials && quickAccCredentials.code
        }),
        // This can be a boolean but it can also contain the new signer/primaryKeyBackup, which instructs /second-key to update acc upon successful signature
        recoveryMode: finalBundle.recoveryMode,
        canSkip2FA,
        isGasTankEnabled: currentAccGasTankState.isEnabled && !!relayerURL,
        meta: (!!finalBundle.meta && finalBundle.meta) || null
      }
    )
    if (!success) {
      if (!message) throw new Error('Secondary key: no success but no error message')
      if (message.includes('invalid confirmation code')) {
        addToast('Unable to sign: wrong confirmation code', { error: true })
        return
      }
      throw new Error(`Secondary key error: ${message}`)
    }
    if (confCodeRequired) {
      setSigningStatus({ quickAcc: true, finalBundle, confCodeRequired })
    } else {
      if (!signature) throw new Error('QuickAcc internal error: there should be a signature')
      if (!account.primaryKeyBackup)
        throw new Error(
          'No key backup found: you need to import the account from JSON or login again.'
        )
      setSigningStatus({
        quickAcc: true,
        inProgress: true,
        confCodeRequired: canSkip2FA ? 'notRequired' : undefined
      })
      if (!finalBundle.recoveryMode) {
        // Make sure we let React re-render without blocking (decrypting and signing will block)
        await new Promise((resolve) => setTimeout(resolve, 0))
        const pwd = quickAccCredentials.passphrase || alert('Enter password')
        const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), pwd)
        await finalBundle.sign(wallet)
      } else {
        // set both .signature and .signatureTwo to the same value: the secondary signature
        // this will trigger a timelocked txn
        finalBundle.signature = signature
      }
      finalBundle.signatureTwo = signature
      return await finalBundle.submit({ relayerURL, fetch })
    }
  }

  const insufficientFee =
    estimation &&
    estimation.feeInUSD &&
    !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation, isGasTankEnabled, network)
  const willFail = (estimation && !estimation.success) || insufficientFee
  if (willFail) {
    return <div className={styles.buttons}>{rejectButton}</div>
  }

  const isRecoveryMode =
    signingStatus && signingStatus.finalBundle && signingStatus.finalBundle.recoveryMode
  if (signingStatus && signingStatus.quickAcc) {
    return (
      <div className={styles.wrapper}>
        {signingStatus.confCodeRequired ? (
          <div className={styles.confirmationCodeInfo}>
            <div className={styles.confirmationCodeInfoTitle}>Confirmation</div>
            <div className={styles.confirmationCodeInfoMessage}>
              {signingStatus.confCodeRequired === 'otp' ? (
                <p>Please enter your OTP code and your password.</p>
              ) : null}
              {signingStatus.confCodeRequired === 'email' ? (
                isRecoveryMode ? (
                  <p>
                    A confirmation code was sent to your email. Please enter it to initiate the
                    recovery.
                  </p>
                ) : (
                  <p>
                    A confirmation code was sent to your email. Please enter it along with your
                    password.
                  </p>
                )
              ) : null}
            </div>
          </div>
        ) : null}

        <form
          ref={form}
          className={styles.quickAccSigningForm}
          onSubmit={(e) => {
            e.preventDefault()

            if (!form.current.checkValidity()) return
            approveTxn({ quickAccCredentials })
          }}
        >
          {signingStatus.confCodeRequired === 'notRequired' && (
            <p className={styles.code2faNotRequiredMsg}>
              You already sent 3 or more transactions to this address, confirmation code is not
              needed.
            </p>
          )}
          <div className={styles.inputsContainer}>
            <TextInput
              password
              required
              minLength={3}
              placeholder="Password"
              value={quickAccCredentials.passphrase}
              style={isRecoveryMode ? { visibility: 'hidden' } : {}}
              disabled={isRecoveryMode}
              onChange={(value) =>
                setQuickAccCredentials({ ...quickAccCredentials, passphrase: value })
              }
              className={styles.textInput}
              testId="password"
            />
            {/* Changing the autoComplete prop to a random string seems to disable it in more cases */}
            {signingStatus.confCodeRequired !== 'notRequired' && (
              <TextInput
                title="Confirmation code should be 6 digits"
                autoComplete="nope"
                required
                minLength={6}
                maxLength={6}
                placeholder={
                  signingStatus.confCodeRequired === 'otp'
                    ? 'Authenticator OTP code'
                    : 'Confirmation code'
                }
                value={quickAccCredentials.code}
                onChange={(value) =>
                  setQuickAccCredentials({ ...quickAccCredentials, code: value })
                }
                className={styles.textInput}
                testId="confirmationCode"
              />
            )}
          </div>
          <div className={styles.buttons}>
            <Button
              variant="danger"
              disabled={signingStatus?.inProgress}
              className={cn(styles.button, styles.danger)}
              onClick={cancelSigning}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primaryGradient"
              className={cn(styles.button, styles.confirm)}
              loading={signingStatus?.inProgress}
              testId="confirmSigning"
              type="submit"
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.buttons}>
      {rejectButton}
      <Button
        variant="primaryGradient"
        className={cn(styles.button, styles.confirm)}
        disabled={!estimation}
        loading={signingStatus?.inProgress}
        loadingText="Signing..."
        onClick={approveTxn}
        testId="approveTxn"
      >
        Sign and Send
      </Button>
    </div>
  )
}

export default Actions
