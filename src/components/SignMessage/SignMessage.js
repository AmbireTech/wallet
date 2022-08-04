import './SignMessage.scss'
import { MdBrokenImage, MdCheck, MdClose } from 'react-icons/md'
import { Wallet } from 'ethers'
import { signMessage712, signMessage, Bundle } from 'adex-protocol-eth/js/Bundle'
import {
  toUtf8String,
  toUtf8Bytes,
  arrayify,
  isHexString,
  _TypedDataEncoder,
  AbiCoder,
  keccak256
} from 'ethers/lib/utils'
import * as blockies from 'blockies-ts';
import { getWallet } from 'lib/getWallet'
import { useToasts } from 'hooks/toasts'
import { fetchPost } from 'lib/fetch'
import { verifyMessage } from '@ambire/signature-validator'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Loading, TextInput, ToolTip } from 'components/common'
import { isObject } from 'url/util'
import { MdInfoOutline } from 'react-icons/md'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { getProvider } from 'lib/provider'
import { getNetworkByChainId } from 'lib/getNetwork'

const CONF_CODE_LENGTH = 6

export default function SignMessage ({ toSign, resolve, account, connections, relayerURL, totalRequests }) {
  const defaultState = () => ({ codeRequired: false, passphrase: '' })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())
  const [isLoading, setLoading] = useState(false)
  const [isDeployed, setIsDeployed] = useState(null)
  const [hasPrivileges, setHasPrivileges] = useState(null)
  const [hasProviderError, setHasProviderError] = useState(null)

  const [confFieldState, setConfFieldState] = useState({isShown: false,  confCodeRequired: ''})
  const [promiseResolve, setPromiseResolve] = useState(null)
  const inputSecretRef = useRef(null)

  const connection = connections.find(({ uri }) => uri === toSign.wcUri)
  const dApp = connection ? connection?.session?.peerMeta || null : null

  let typeDataErr
  let dataV4
  let requestedChainId = toSign.chainId
  const isTypedData = ['eth_signTypedData_v4', 'eth_signTypedData'].indexOf(toSign.type) !== -1

  if (isTypedData) {
    dataV4 = toSign.txn

    if (isObject(dataV4)) {
      try {
        if (dataV4.types.EIP712Domain) { // Avoids failure in case some dapps explicitly add this (redundant) prop
          delete dataV4.types.EIP712Domain
        }
        _TypedDataEncoder.hash(dataV4.domain, dataV4.types, dataV4.message)
        // enforce chainId
        if (dataV4.domain.chainId) {
          requestedChainId = dataV4.domain.chainId
        }
      } catch {
        typeDataErr = '.txn has Invalid TypedData object. Should be {domain, types, message}'
      }
    } else {
      typeDataErr = '.txn should be a TypedData object'
    }
  }

  const requestedNetwork = getNetworkByChainId(requestedChainId)

  useEffect(()=> {
    if (confFieldState.isShown) inputSecretRef.current.focus()
  }, [confFieldState])


  const checkIsDeployedAndHasPrivileges = useCallback(async () => {
    if (!requestedNetwork) return

    const bundle = new Bundle({
      network: requestedNetwork.id,
      identity: account.id,
      signer: account.signer
    })

    const provider = await getProvider(requestedNetwork.id)

    let privilegeAddress
    let quickAccAccountHash
    if (account.signer.quickAccManager) {
      const { quickAccTimelock } = accountPresets
      const quickAccountTuple = [quickAccTimelock, account.signer.one, account.signer.two]
      const abiCoder = new AbiCoder()
      quickAccAccountHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
      privilegeAddress = account.signer.quickAccManager
    } else {
      privilegeAddress = account.signer.address
    }


    // to differenciate reverts and network issues
    const callObject = {
      method: "eth_call",
      params: [
        {
          to: bundle.identity,
          data: '0xc066a5b1000000000000000000000000' + privilegeAddress.toLowerCase().substring(2)
        },
        'latest'
      ],
      id: 1,
      jsonrpc:'2.0'
    }

    fetchPost(provider.connection.url, callObject)
      .then(result => {
        if (result.result && result.result !== '0x') {
          setIsDeployed(true)
          if (account.signer.quickAccManager) {
            setHasPrivileges(result.result === quickAccAccountHash)
          } else {
            //TODO: To ask : in what cases it's more than 1?
            if (result.result === '0x0000000000000000000000000000000000000000000000000000000000000001') {
              setHasPrivileges(true)
            } else {
              setHasPrivileges(false)
            }
          }
        } else { // result.error or anything else that does not have a .result prop, we assume it is not deployed
          setIsDeployed(false)
        }
      })
      .catch(err => {
        // as raw XHR calls, reverts are not caught, but only have .error prop
        // this should be a netowrk error
        setHasProviderError(err.message)
      })

  }, [account, requestedNetwork])

  useEffect(() => {
    checkIsDeployedAndHasPrivileges()
  }, [checkIsDeployedAndHasPrivileges])

  if (!toSign || !account) return (<></>)

  // should not happen unless chainId is dropped for some reason in addRequests
  if (!requestedNetwork) {
    return (<div id='signMessage'>
      <h3 className='error'>Inexistant network for chainId : { requestedChainId }</h3>
      <Button className='reject' onClick={() => resolve({ message: 'signature denied' })}>Reject</Button>
    </div>)
  }

  if (typeDataErr) return (<div id='signMessage'>
    <h3 className='error'>Invalid signing request: { typeDataErr }</h3>
    <Button className='reject' onClick={() => resolve({ message: 'signature denied' })}>Reject</Button>
  </div>)

  const handleSigningErr = e => {
    console.error('Signing error', e)
    if (e && e.message.includes('must provide an Ethereum address')) {
      addToast(`Signing error: not connected with the correct address. Make sure you're connected with ${account.signer.address}.`, { error: true })
    } else {
      addToast(`Signing error: ${e.message || e}`, { error: true })
    }
  }

  const verifySignature = (toSign, sig, networkId) => {
    const provider = getProvider(networkId)
    return verifyMessage({
      provider,
      signer: account.id,
      message: isTypedData ? null : getMessageAsBytes(toSign.txn),
      typedData: isTypedData ? dataV4 : null,
      signature: sig
    }).then(verificationResult => {
      if (verificationResult) {
        return true
      } else {
        throw Error(toSign.type + ': signature verification failed.')
      }
    }).catch(e => {
      throw Error(toSign.type + ': signature verification failed. ' + e.message)
    })
  }

  const approveQuickAcc = async confirmationCode => {
    if (!relayerURL) {
      addToast('Email/pass accounts not supported without a relayer connection', { error: true })
      return
    }
    if (!signingState.passphrase) {
      addToast('Password required to unlock the account', { error: true })
      return
    }
    setLoading(true)
    try {

      const { signature, success, message, confCodeRequired } = await fetchPost(
        // network doesn't matter when signing
        // if it does tho, we can use ${network.id}
        `${relayerURL}/second-key/${account.id}/ethereum/sign${isTypedData ? '?typedData=true' : ''}`, {
          toSign: toSign.txn,
          code: confirmationCode
        }
      )
      if (!success) {
        if (!message) throw new Error(`Secondary key: no success but no error message`)
        if (message.includes('invalid confirmation code')) {
          addToast('Unable to sign: wrong confirmation code', { error: true })
        }
        addToast(`Second signature error: ${message}`, { error: true })
        setConfFieldState({ isShown: false, confCodeRequired: null })
        setLoading(false)
        return
      }
      if (confCodeRequired) {
        setConfFieldState({ isShown: true, confCodeRequired })
        const confCode = await new Promise((resolve, reject) => { setPromiseResolve(() => resolve) })
        if (!confCode) throw new Error('You must enter a confirmation code')
        await approveQuickAcc(confCode)
        setLoading(false)
        return
      }

      if (!account.primaryKeyBackup) throw new Error(`No key backup found: you need to import the account from JSON or login again.`)
      const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), signingState.passphrase)

      const sig = await (isTypedData
        ? signMessage712(wallet, account.id, account.signer, dataV4.domain, dataV4.types, dataV4.message, signature)
        : signMessage(wallet, account.id, account.signer, getMessageAsBytes(toSign.txn), signature)
      )

      await verifySignature(toSign, sig, requestedNetwork.id)

      resolve({ success: true, result: sig })
      addToast(`Successfully signed!`)
    } catch(e) { handleSigningErr(e) }
    setLoading(false)
  }

  const approve = async () => {
    if (account.signer.quickAccManager) {
      await approveQuickAcc()
      return
    }

    setLoading(true)
    try {
      // if quick account, wallet = await fromEncryptedBackup
      // and just pass the signature as secondSig to signMessage
      const wallet = getWallet({
        signer: account.signer,
        signerExtra: account.signerExtra,
        chainId: 1 // does not matter
      })
      // It would be great if we could pass the full data cause then web3 wallets/hw wallets can display the full text
      // Unfortunately that isn't possible, because isValidSignature only takes a bytes32 hash; so to sign this with
      // a personal message, we need to be signing the hash itself as binary data such that we match 'Ethereum signed message:\n32<hash binary data>' on the contract

      // forcing signer to be connected to the matching chain (MM)
      const isConnected = await wallet.isConnected(account.signer.address, requestedNetwork.chainId)
      if (!isConnected) {
        throw Error(`Please connect your signer wallet ${account.signer.address} to the correct chain :  ${requestedNetwork.id}`)
      }

      const sig = await ((toSign.type === 'eth_signTypedData_v4' || toSign.type === 'eth_signTypedData')
        ? signMessage712(wallet, account.id, account.signer, dataV4.domain, dataV4.types, dataV4.message)
        : signMessage(wallet, account.id, account.signer, getMessageAsBytes(toSign.txn))
      )

      await verifySignature(toSign, sig, requestedNetwork.id)

      resolve({ success: true, result: sig })
      addToast(`Successfully signed!`)
    } catch(e) { handleSigningErr(e) }
    setLoading(false)
  }

  const handleInputConfCode = e => {
    if (e.length === CONF_CODE_LENGTH) promiseResolve(e)
  }

  const handleSubmit = e => {
    e.preventDefault()
    approve()
  }

  return (<div id='signMessage'>
    <div id='signingAccount' className='panel'>
      <div className='title'>
        Signing with account
      </div>
      <div className="content">
        <div className='signingAccount-account'>
          <img className='icon' src={blockies.create({ seed: account.id }).toDataURL()} alt='Account Icon'/>
          { account.id }
        </div>
        <div className='signingAccount-network'>
          on
          <div className='icon' style={{ backgroundImage: `url(${requestedNetwork.icon})` }}/>
          <div className='address'>{ requestedNetwork.name }</div>
        </div>
      </div>
    </div>
    <div className='panel'>
      <div className='title signMessageTitle'>
        <span className='signMessageTitle-title'>
          Sign message
        </span>
        <span className='signMessageTitle-signatureType'>
          <ToolTip label={`${isTypedData ? 'An EIP-712 typed data signature has been requested' : 'An ethSign ethereum signature type has been requested'}`}>
            <MdInfoOutline /> <span>{isTypedData ? 'EIP-712 type' : 'standard type'}</span>
          </ToolTip>
        </span>
      </div>

      <div className='request-message'>
        <div className='dapp-message'>
          {
            dApp ?
              <a className='dapp' href={dApp.url} target="_blank" rel="noreferrer">
                <div className='icon' style={{ backgroundImage: `url(${dApp.icons[0]})` }}>
                 <MdBrokenImage/>
                </div>
                { dApp.name }
              </a>
              :
              'A dApp '
          }
          is requesting your signature.
        </div>
        <span>{totalRequests > 1 ? `You have ${totalRequests - 1} more pending requests.` : ''}</span>
      </div>

      <textarea
        className='sign-message'
        type='text'
        value={dataV4 ? JSON.stringify(dataV4, '\n', ' ') : (toSign.txn !== '0x' ? getMessageAsText(toSign.txn) : '(Empty message)')}
        readOnly={true}
      />

      <div className='actions'>
        <form onSubmit={handleSubmit}>
          {account.signer.quickAccManager && isDeployed && (<>
            <TextInput
              password
              required minLength={3}
              placeholder='Account password'
              value={signingState.passphrase}
              onChange={value => setSigningState({ ...signingState, passphrase: value })}
            ></TextInput>
            <input type="submit" hidden />
          </>)}

          {confFieldState.isShown && (
            <>
              {confFieldState.confCodeRequired === 'email' &&
              (<span>A confirmation code has been sent to your email, it is valid for 3 minutes.</span>)}
              {confFieldState.confCodeRequired === 'otp' && (<span>Please enter your OTP code</span>)}
              <TextInput
                ref={inputSecretRef}
                placeholder={confFieldState.confCodeRequired === 'otp' ? 'Authenticator OTP code' : 'Confirmation code'}
                onInput={value => handleInputConfCode(value)}
              />
            </>
            )}

          {
            (isDeployed === null && !hasProviderError) && (
              <div>
                <Loading />
              </div>
            )
          }

          {isDeployed === false && (<div>
              <h3 className='error'>You can't sign this message yet.</h3>
              <h3 className='error'>
              You need to complete your first transaction on {requestedNetwork.name} network in order to be able to sign messages.
              </h3>
            </div>
          )}

          {
            hasPrivileges === false  && (<div>
                <h3 className='error'>You do not have the privileges to sign this message.</h3>
              </div>
            )
          }

          {
            hasProviderError  && (<div>
                <h3 className='error'>
                  There was an issue with the network provider: {hasProviderError}
                </h3>
              </div>
            )
          }

          <div className="buttons">
            <Button
              type='button'
              danger
              icon={<MdClose/>}
              className='reject'
              onClick={() => resolve({ message: 'signature denied' })}
            >Reject</Button>
            {(isDeployed !== null && isDeployed) && hasPrivileges && (
              <Button type='submit' className='approve' disabled={isLoading}>
              {isLoading ? (<><Loading/>Signing...</>)
              : (<><MdCheck/> Sign</>)}
            </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  </div>)
}

function getMessageAsBytes(msg) {
  // Transforming human message / hex string to bytes
  if (!isHexString(msg)) {
    return toUtf8Bytes(msg)
  } else {
    return arrayify(msg)
  }
}

function getMessageAsText(msg) {
  if (isHexString(msg)) {
    try { return toUtf8String(msg) }
    catch(_) { return msg }
  }
  return msg?.toString ? msg.toString() : msg + ''//what if dapp sends it as object? force string to avoid app crashing
}
