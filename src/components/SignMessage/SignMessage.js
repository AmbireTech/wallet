import * as blockies from "blockies-ts"
import { toUtf8String, isHexString } from "ethers/lib/utils"
import supportedDApps from "ambire-common/src/constants/supportedDApps"
import styles from "./SignMessage.module.scss"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button, Loading, TextInput, ToolTip, DAppIncompatibilityWarningMsg, Panel } from "components/common"
import cn from "classnames"
import { onMsgRejected, onMsgSigned } from 'components/SDK/WindowMessages'
import { useSignMessage } from "hooks"
import AccountAndNetwork from "components/common/AccountAndNetwork/AccountAndNetwork"

import { MdBrokenImage, MdClose, MdInfoOutline } from "react-icons/md"

const CONF_CODE_LENGTH = 6

export default function SignMessage({ everythingToSign, resolve, account, relayerURL, totalRequests, useStorage }) {
  const defaultState = () => ({ codeRequired: false, passphrase: "" })
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
    useStorage,
  })

  const isDAppSupported = dApp && (supportedDApps.includes(dApp.url) || supportedDApps.includes(dApp.url+'/'))

  const rejectMsg = useCallback(() => {
    resolve({ message: "signature denied" })
    onMsgRejected()
  }, [resolve])

  useEffect(() => {
    if (confirmationType) inputSecretRef.current.focus()
  }, [confirmationType])

  if (!msgToSign || !account) return <></>

  // should not happen unless chainId is dropped for some reason in addRequests
  if (!requestedNetwork) {
    return (
      <div className={styles.wrapper}>
        <h3 className='error'>
        Unexistent network for chainId : {requestedChainId}
        </h3>
        <Button
          className={styles.reject}
          onClick={rejectMsg}
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
          onClick={rejectMsg}
        >
          Reject
        </Button>
      </div>
    )

  const handleInputConfCode = (e) => {
    if (e.length === CONF_CODE_LENGTH) promiseResolve(e)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await approve({
      password: signingState.passphrase
    })
    onMsgSigned()
  }

  return (
    <div className={styles.wrapper}>
      <Panel title="Signing with account" titleClassName={styles.panelTitle} className={styles.panel}>
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
          {(totalRequests > 1) ? <span>
            You have {totalRequests - 1} more pending requests.
          </span> : null}
          {!isDAppSupported && <DAppIncompatibilityWarningMsg />}
        </div>

        <textarea
          className={styles.signMessage}
          type='text'
          value={
            dataV4
              ? JSON.stringify(dataV4, "\n", " ")
              : msgToSign.txn !== "0x"
              ? getMessageAsText(msgToSign.txn)
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

            {isDeployed === null && (
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
                  The currently used signer is not authorized to control this account and therefore you cannot sign messages.
                </h3>
              </div>
            )}

            <div className={styles.buttons}>
              <Button
                className={styles.button}
                type='button'
                danger
                icon={<MdClose />}
                onClick={rejectMsg}
              >
                Reject
              </Button>
              {isDeployed !== null && isDeployed && hasPrivileges && (
                <Button type='submit' primaryGradient disabled={isLoading} className={styles.button}>
                  {isLoading ? "Signing..." : "Sign"}
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
