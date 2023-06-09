import { useState, useEffect, useRef } from 'react'
import * as blockies from 'blockies-ts'
import { toUtf8String, isHexString } from 'ethers/lib/utils'
import supportedDApps from 'ambire-common/src/constants/supportedDApps'
import cn from 'classnames'

import { useSignMessage } from 'hooks'
import {
  Button,
  Loading,
  TextInput,
  ToolTip,
  DAppIncompatibilityWarningMsg,
  Panel
} from 'components/common'
import AccountAndNetwork from 'components/common/AccountAndNetwork/AccountAndNetwork'

import { MdBrokenImage, MdInfoOutline } from 'react-icons/md'

import styles from './SignMessage.module.scss'

const CONF_CODE_LENGTH = 6

export default function SignMessage({
  everythingToSign,
  resolve,
  account,
  relayerURL,
  totalRequests,
  useStorage
}) {
  const defaultState = () => ({ codeRequired: false, passphrase: '' })
  const [signingState, setSigningState] = useState(defaultState())
  const [promiseResolve, setPromiseResolve] = useState(null)
  const inputSecretRef = useRef(null)

  const onConfirmationCodeRequired = async (confCodeRequired, approveQuickAcc) => {
    const confCode = await new Promise((resolve) => {
      setPromiseResolve(() => resolve)
    })
    if (!confCode) throw new Error('You must enter a confirmation code')
    await approveQuickAcc({
      password: signingState.passphrase,
      code: confCode
    })
  }

  const {
    approve,
    msgToSign,
    isLoading,
    hasPrivileges,
    typeDataErr,
    isDeployed,
    dataV4,
    requestedNetwork,
    requestedChainId,
    isTypedData,
    confirmationType,
    dApp
  } = useSignMessage({
    account,
    messagesToSign: everythingToSign,
    relayerURL,
    resolve,
    onConfirmationCodeRequired,
    useStorage
  })

  const isDAppSupported =
    dApp && (supportedDApps.includes(dApp.url) || supportedDApps.includes(`${dApp.url}/`))

  useEffect(() => {
    if (confirmationType) inputSecretRef.current.focus()
  }, [confirmationType])

  if (!msgToSign || !account) return <></>

  // should not happen unless chainId is dropped for some reason in addRequests
  if (!requestedNetwork) {
    return (
      <div className={styles.wrapper}>
        <h3 className="error">Unexistent network for chainId : {requestedChainId}</h3>
        <Button className={styles.reject} onClick={() => resolve({ message: 'signature denied' })}>
          Reject
        </Button>
      </div>
    )
  }

  if (typeDataErr)
    return (
      <div className={styles.wrapper}>
        <h3 className="error">Invalid signing request: {typeDataErr}</h3>
        <Button className={styles.reject} onClick={() => resolve({ message: 'signature denied' })}>
          Reject
        </Button>
      </div>
    )

  const handleInputConfCode = (e) => {
    if (e.length === CONF_CODE_LENGTH) promiseResolve(e)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    approve({
      password: signingState.passphrase
    })
  }

  return (
    <div className={styles.wrapper}>
      <Panel
        title="Signing with account"
        titleClassName={styles.panelTitle}
        className={styles.panel}
      >
        <AccountAndNetwork
          address={account.id}
          networkName={requestedNetwork.name}
          networkId={requestedNetwork.id}
          avatar={blockies.create({ seed: account.id }).toDataURL()}
          maxAddressLength={30}
        />
      </Panel>
      <Panel className={styles.panel}>
        <div className={cn(styles.title, styles.signMessageTitle)}>
          <span className={styles.signMessageTitleTitle}>Sign message</span>
          <span className={styles.signMessageTitleSignatureType}>
            <ToolTip
              label={`${
                isTypedData
                  ? 'An EIP-712 typed data signature has been requested'
                  : 'An ethSign ethereum signature type has been requested'
              }`}
            >
              <MdInfoOutline /> <span>{isTypedData ? 'EIP-712 type' : 'standard type'}</span>
            </ToolTip>
          </span>
        </div>

        <div className={styles.requestMessage}>
          <div className={styles.dappMessage}>
            {dApp ? (
              <a className={styles.dapp} href={dApp.url} target="_blank" rel="noreferrer">
                <div
                  className={styles.icon}
                  style={{ backgroundImage: `url(${dApp.icons ? dApp.icons[0] : 'none'})` }}
                >
                  <MdBrokenImage />
                </div>
                {dApp.name}
              </a>
            ) : (
              'A dApp '
            )}
            is requesting your signature.
          </div>
          {totalRequests > 1 ? (
            <span>You have {totalRequests - 1} more pending requests.</span>
          ) : null}
          {!isDAppSupported && <DAppIncompatibilityWarningMsg />}
        </div>

        <textarea
          className={styles.signMessage}
          type="text"
          value={
            dataV4
              ? JSON.stringify(dataV4, '\n', ' ')
              : msgToSign.txn !== '0x'
              ? getMessageAsText(msgToSign.txn)
              : '(Empty message)'
          }
          readOnly
        />

        <div className={styles.actions}>
          <form onSubmit={handleSubmit}>
            {account.signer.quickAccManager && isDeployed !== null && (
              <>
                <TextInput
                  password
                  required
                  minLength={3}
                  placeholder="Account password"
                  value={signingState.passphrase}
                  onChange={(value) => setSigningState({ ...signingState, passphrase: value })}
                />
                <input type="submit" hidden />
              </>
            )}

            {confirmationType && (
              <>
                {confirmationType === 'email' && (
                  <span>
                    A confirmation code has been sent to your email, it is valid for 3 minutes.
                  </span>
                )}
                {confirmationType === 'otp' && <span>Please enter your OTP code</span>}
                <TextInput
                  ref={inputSecretRef}
                  placeholder={
                    confirmationType === 'otp' ? 'Authenticator OTP code' : 'Confirmation code'
                  }
                  onInput={(value) => handleInputConfCode(value)}
                />
              </>
            )}

            {isDeployed === null && (
              <div>
                <Loading />
              </div>
            )}

            {isDeployed && hasPrivileges === false && (
              <div>
                <h3 className="error">
                  The currently used signer is not authorized to control this account and therefore
                  you cannot sign messages.
                </h3>
              </div>
            )}

            <div className={styles.buttons}>
              <Button
                className={styles.button}
                type="button"
                variant="danger"
                onClick={() => resolve({ message: 'signature denied' })}
              >
                Reject
              </Button>
              {((isDeployed && hasPrivileges) || isDeployed === false) && (
                <Button
                  type="submit"
                  variant="primaryGradient"
                  className={styles.button}
                  loading={isLoading}
                  loadingText="Signing..."
                >
                  Sign
                </Button>
              )}
            </div>
          </form>
        </div>
      </Panel>
    </div>
  )
}

function getMessageAsText(msg) {
  if (isHexString(msg)) {
    try {
      return toUtf8String(msg)
    } catch (_) {
      return msg
    }
  }
  return msg?.toString ? msg.toString() : `${msg}` // what if dapp sends it as object? force string to avoid app crashing
}
