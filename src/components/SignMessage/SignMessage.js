import './SignMessage.scss'
import { MdBrokenImage, MdCheck, MdClose } from 'react-icons/md'
import { Wallet } from 'ethers'
import { toUtf8String, keccak256, arrayify, isHexString } from 'ethers/lib/utils'
import { signMsgHash, Bundle } from 'adex-protocol-eth/js/Bundle'
import * as blockies from 'blockies-ts';
import { getWallet } from 'lib/getWallet'
import { useToasts } from 'hooks/toasts'
import { fetchPost } from 'lib/fetch'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getProvider } from 'lib/provider'
import { Button, Loading, TextInput } from 'components/common'

const CONF_CODE_LENGTH = 6

export default function SignMessage ({ toSign, resolve, account, connections, relayerURL, totalRequests, network }) {
  const defaultState = () => ({ codeRequired: false, passphrase: '' })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())
  const [isLoading, setLoading] = useState(false)
  const [isDeployed, setIsDeployed] = useState(null)
  const [confFieldState, setConfFieldState] = useState({isShown: false,  confCodeRequired: ''})
  const [promiseResolve, setPromiseResolve] = useState(null)
  const inputSecretRef = useRef(null)
  
  const connection = connections.find(({ uri }) => uri === toSign.wcUri)
  const dApp = connection ? connection?.session?.peerMeta || null : null
  
  useEffect(()=> {
    if (confFieldState.isShown) inputSecretRef.current.focus()
  }, [confFieldState])
  
  const checkIsDeployed = useCallback(async () => {
    const bundle = new Bundle({
      network: network.id,
      identity: account.id,
      signer: account.signer
    })

    const provider = await getProvider(network.id)
    const isDeployed = await provider.getCode(bundle.identity).then(code => code !== '0x')
    setIsDeployed(isDeployed)
  }, [account, network])

  useEffect(() => {
    checkIsDeployed()
  }, [checkIsDeployed])

  if (!toSign || !account) return (<></>)
  if (toSign && !isHexString(toSign.txn)) return (<div id='signMessage'>
    <h3 className='error'>Invalid signing request: .txn has to be a hex string</h3>
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
      const hash = keccak256(arrayify(toSign.txn))

      const { signature, success, message, confCodeRequired } = await fetchPost(
        // network doesn't matter when signing
        `${relayerURL}/second-key/${account.id}/ethereum/sign`, {
          toSign: hash,
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
      const sig = await signMsgHash(wallet, account.id, account.signer, arrayify(hash), signature)
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
      // and just pass the signature as secondSig to signMsgHash
      const wallet = getWallet({
        signer: account.signer,
        signerExtra: account.signerExtra,
        chainId: 1 // does not matter
      })
      // It would be great if we could pass the full data cause then web3 wallets/hw wallets can display the full text
      // Unfortunately that isn't possible, because isValidSignature only takes a bytes32 hash; so to sign this with
      // a personal message, we need to be signing the hash itself as binary data such that we match 'Ethereum signed message:\n32<hash binary data>' on the contract
      const hash = keccak256(arrayify(toSign.txn)) // hacky equivalent is: id(toUtf8String(toSign.txn)) 
      const sig = await signMsgHash(wallet, account.id, account.signer, arrayify(hash))
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
        <img className='icon' src={blockies.create({ seed: account.id }).toDataURL()} alt='Account Icon'/>
        { account.id }
      </div>
    </div>
    <div className='panel'>
      <div className='title'>
        Sign message
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
        value={getMessageAsText(toSign.txn)}
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
         
          {!isDeployed && (<div>
              <h3 className='error'>You can't sign this message yet.</h3>
              <h3 className='error'>
              You need to complete your first transaction from you ambire wallet and your smart wallet will be deployed cross-chain on the same addresses.
              </h3>
            </div>
          )}

          <div className="buttons">
            <Button
              type='button'
              danger
              icon={<MdClose/>}
              className='reject'
              onClick={() => resolve({ message: 'signature denied' })}
            >Reject</Button>
            {isDeployed !== null && isDeployed && (
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

function getMessageAsText(msg) {
  try { return toUtf8String(msg) }
  catch(_) { return msg }
}