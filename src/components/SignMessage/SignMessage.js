import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import * as blockies from 'blockies-ts'
import { toUtf8String, isHexString } from 'ethers/lib/utils'
import cn from 'classnames'
import { UNISWAP_UNIVERSAL_ROUTERS, PERMIT_2_ADDRESS } from 'consts/specialAddresses'

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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [signingState, setSigningState] = useState(defaultState())
  const [promiseResolve, setPromiseResolve] = useState(null)
  const inputSecretRef = useRef(null)
  const textAreaRef = useRef(null)
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const isTomek = queryParams.get('isTomek')

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

  const isSnapshot = (_dappName, _txn) =>
    _dappName &&
    ['https://snapshot.org', 'https://snapshot.box'].includes(_dappName) &&
    _txn.domain &&
    _txn.domain.name === 'snapshot'
  const isOkPermit2 = (_txn, _chainId) =>
    _txn.primaryType &&
    _txn.primaryType.toLowerCase().includes('permit') &&
    _txn.message &&
    _txn.message.spender &&
    UNISWAP_UNIVERSAL_ROUTERS[_chainId] &&
    _txn.message.spender.toLowerCase() === UNISWAP_UNIVERSAL_ROUTERS[_chainId].toLowerCase() &&
    _txn.domain &&
    _txn.domain.verifyingContract &&
    _txn.domain.verifyingContract.toLowerCase() === PERMIT_2_ADDRESS.toLowerCase()
  const isSigTool = (_dappUrl) => _dappUrl === 'https://sigtool.ambire.com/'

  const isDAppSupported =
    !isTypedData ||
    isTomek === 'true' ||
    (dApp && dataV4 && isSnapshot(dApp.url, dataV4)) ||
    isOkPermit2(dataV4, requestedChainId) ||
    (dApp && isSigTool(dApp.url))

  const onScroll = (textArea) => {
    if (textArea.scrollHeight - textArea.scrollTop - textArea.clientHeight < 1) {
      setHasScrolledToBottom(true)
    }
  }

  useEffect(() => {
    const textArea = textAreaRef?.current

    if (!textArea) return

    // Initial run. Important for the case when the textarea doesn't have a scrollbar
    onScroll(textArea)

    textArea.addEventListener('scroll', () => onScroll(textArea))

    return () => {
      textArea.removeEventListener('scroll', () => onScroll(textArea))
    }
  }, [])

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
          {!!typeDataErr && (
            <DAppIncompatibilityWarningMsg title="Unable to sign" msg={typeDataErr} />
          )}
        </div>

        <textarea
          className={styles.signMessage}
          type="text"
          ref={textAreaRef}
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
            {!hasScrolledToBottom && !typeDataErr && (
              <div>
                <h3 className="error">Please read the message before signing.</h3>
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
                  disabled={!isDAppSupported || !hasScrolledToBottom || typeDataErr}
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
