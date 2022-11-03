import useSignMessage from "ambire-common/src/hooks/useSignMessage"
import supportedDApps from "ambire-common/src/constants/supportedDApps"

import styles from "./SignMessage.module.scss"

import { MdBrokenImage, MdCheck, MdClose, MdInfoOutline } from "react-icons/md"
import { toUtf8String, isHexString } from "ethers/lib/utils"
import * as blockies from "blockies-ts"
import { getWallet } from "lib/getWallet"
import { useToasts } from "hooks/toasts"
import { useState, useEffect, useRef } from "react"
import { Button, Loading, TextInput, ToolTip, DAppIncompatibilityWarningMsg, Panel } from "components/common"
import { networkIconsById } from 'consts/networks'
import cn from "classnames"

import useLocalStorage from 'hooks/useLocalStorage'

const CONF_CODE_LENGTH = 6

export default function SignMessage({ everythingToSign, resolve, account, relayerURL, totalRequests }) {
  const defaultState = () => ({ codeRequired: false, passphrase: "" })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())
  const [promiseResolve, setPromiseResolve] = useState(null)
  const inputSecretRef = useRef(null)

  const onConfirmationCodeRequired = async (confCodeRequired, approveQuickAcc) => {
    const confCode = await new Promise((resolve) => {
      setPromiseResolve(() => resolve)
    })
    if (!confCode) throw new Error("You must enter a confirmation code")
    await approveQuickAcc({
      password: signingState.passphrase,
      code: confCode
    })

    return
  }

  const getHardwareWallet = () => {
    // if quick account, wallet = await fromEncryptedBackup
    // and just pass the signature as secondSig to signMsgHash
    const wallet = getWallet(
      {
        signer: account.signer,
        signerExtra: account.signerExtra,
        chainId: 1 // does not matter
      }
    )

    return wallet
  }

  const {
    approve,
    toSign,
    isLoading,
    hasPrivileges,
    hasProviderError,
    typeDataErr,
    isDeployed,
    dataV4,
    requestedNetwork,
    requestedChainId,
    isTypedData,
    confirmationType,
    dApp
  } = useSignMessage({
    fetch,
    account,
    everythingToSign,
    relayerURL,
    addToast,
    resolve,
    onConfirmationCodeRequired,
    getHardwareWallet,
    useStorage: useLocalStorage,
  })

  const isDAppSupported = dApp && (supportedDApps.includes(dApp.url) || supportedDApps.includes(dApp.url+'/'))

  useEffect(() => {
    if (confirmationType) inputSecretRef.current.focus()
  }, [confirmationType])

  if (!toSign || !account) return <></>

  // should not happen unless chainId is dropped for some reason in addRequests
  if (!requestedNetwork) {
    return (
      <div className={styles.wrapper}>
        <h3 className='error'>
          Inexistant network for chainId : {requestedChainId}
        </h3>
        <Button
          className={styles.reject}
          onClick={() => resolve({ message: "signature denied" })}
        >
          Reject
        </Button>
      </div>
    )
  }

  if (typeDataErr)
    return (
      <div className={styles.wrapper}>
        <h3 className='error'>Invalid signing request: {typeDataErr}</h3>
        <Button
          className={styles.reject}
          onClick={() => resolve({ message: "signature denied" })}
        >
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

  const requestedNetworkIcon = networkIconsById[requestedNetwork.id]

  return (
    <div className={styles.wrapper}>
      <Panel title={'Signing with account'} className={styles.panel}>
        <div className={styles.signingAccountContent}>
          <div className={styles.signingAccountAccount}>
            <img
              className={styles.icon}
              src={blockies.create({ seed: account.id }).toDataURL()}
              alt='Account Icon'
            />
            {account.id}
          </div>
          <div className={styles.signingAccountNetwork}>
            on
            <div
              className={styles.icon}
              style={{ backgroundImage: `url(${requestedNetworkIcon})` }}
            />
            <div className='address'>{requestedNetwork.name}</div>
          </div>
        </div>
      </Panel>
      <Panel className={styles.panel}>
        <div className={cn(styles.title, styles.signMessageTitle)}>
          <span className={styles.signMessageTitleTitle}>Sign message</span>
          <span className={styles.signMessageTitleSignatureType}>
            <ToolTip
              label={`${
                isTypedData
                  ? "An EIP-712 typed data signature has been requested"
                  : "An ethSign ethereum signature type has been requested"
              }`}
            >
              <MdInfoOutline />{" "}
              <span>{isTypedData ? "EIP-712 type" : "standard type"}</span>
            </ToolTip>
          </span>
        </div>

        <div className={styles.requestMessage}>
          <div className={styles.dappMessage}>
            {dApp ? (
              <a
                className={styles.dapp}
                href={dApp.url}
                target='_blank'
                rel='noreferrer'
              >
                <div
                  className={styles.icon}
                  style={{ backgroundImage: `url(${dApp.icons ? dApp.icons[0] : 'none'})` }}
                >
                  <MdBrokenImage />
                </div>
                {dApp.name}
              </a>
            ) : (
              "A dApp "
            )}
            is requesting your signature.
          </div>
          <span>
            {totalRequests > 1
              ? `You have ${totalRequests - 1} more pending requests.`
              : ""}
          </span>
          {!isDAppSupported && <DAppIncompatibilityWarningMsg />}
        </div>

        <textarea
          className={styles.signMessage}
          type='text'
          value={
            dataV4
              ? JSON.stringify(dataV4, "\n", " ")
              : toSign.txn !== "0x"
              ? getMessageAsText(toSign.txn)
              : "(Empty message)"
          }
          readOnly={true}
        />

        <div className={styles.actions}>
          <form onSubmit={handleSubmit}>
            {account.signer.quickAccManager && isDeployed && (
              <>
                <TextInput
                  password
                  required
                  minLength={3}
                  placeholder='Account password'
                  value={signingState.passphrase}
                  onChange={(value) =>
                    setSigningState({ ...signingState, passphrase: value })
                  }
                ></TextInput>
                <input type='submit' hidden />
              </>
            )}

            {confirmationType && (
              <>
                {confirmationType === "email" && (
                  <span>
                    A confirmation code has been sent to your email, it is valid
                    for 3 minutes.
                  </span>
                )}
                {confirmationType === "otp" && (
                  <span>Please enter your OTP code</span>
                )}
                <TextInput
                  ref={inputSecretRef}
                  placeholder={
                    confirmationType === "otp"
                      ? "Authenticator OTP code"
                      : "Confirmation code"
                  }
                  onInput={(value) => handleInputConfCode(value)}
                />
              </>
            )}

            {isDeployed === null && !hasProviderError && (
              <div>
                <Loading />
              </div>
            )}

            {isDeployed === false && (
              <div>
                <h3 className='error'>You can't sign this message yet.</h3>
                <h3 className='error'>
                  You need to complete your first transaction on{" "}
                  {requestedNetwork.name} network in order to be able to sign
                  messages.
                </h3>
              </div>
            )}

            {hasPrivileges === false && (
              <div>
                <h3 className='error'>
                  You do not have the privileges to sign this message.
                </h3>
              </div>
            )}

            {hasProviderError && (
              <div>
                <h3 className='error'>
                  There was an issue with the network provider:{" "}
                  {hasProviderError}
                </h3>
              </div>
            )}

            <div className={styles.buttons}>
              <Button
                type='button'
                danger
                icon={<MdClose />}
                className={styles.reject}
                onClick={() => resolve({ message: "signature denied" })}
              >
                Reject
              </Button>
              {isDeployed !== null && isDeployed && hasPrivileges && (
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loading />
                      Signing...
                    </>
                  ) : (
                    <>
                      <MdCheck /> Sign
                    </>
                  )}
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
  return msg?.toString ? msg.toString() : msg + "" //what if dapp sends it as object? force string to avoid app crashing
}
