import './SignMessage.scss'
import { MdBrokenImage, MdCheck, MdClose } from 'react-icons/md'
import { Wallet } from 'ethers'
import { toUtf8String, keccak256, arrayify, isHexString } from 'ethers/lib/utils'
import { signMsgHash } from 'adex-protocol-eth/js/Bundle'
import * as blockies from 'blockies-ts';
import { getWallet } from 'lib/getWallet'
import { useToasts } from 'hooks/toasts'
import { fetchPost } from 'lib/fetch'
import { useState } from 'react'
import { Button, Loading, TextInput } from 'components/common'

export default function SignMessage ({ toSign, resolve, account, connections, relayerURL, totalRequests }) {
  const defaultState = () => ({ codeRequired: false, passphrase: '' })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())
  const [isLoading, setLoading] = useState(false)

  const connection = connections.find(({ uri }) => uri === toSign.wcUri)
  const dApp = connection ? connection?.session?.peerMeta || null : null

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
        return
      }
      if (confCodeRequired) {
        const confCode = prompt('A confirmation code has been sent to your email, it is valid for 3 minutes. Please enter it here:')
        if (!confCode) throw new Error('You must enter a confirmation code')
        await approveQuickAcc(confCode)
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
        <form onSubmit={e => { e.preventDefault() }}>
          {account.signer.quickAccManager && (<>
            <TextInput
              password
              required minLength={3}
              placeholder='Account password'
              value={signingState.passphrase}
              onChange={value => setSigningState({ ...signingState, passphrase: value })}
            ></TextInput>
          </>)}

          <div className="buttons">
            <Button
              danger
              icon={<MdClose/>}
              className='reject'
              onClick={() => resolve({ message: 'signature denied' })}
            >Reject</Button>
            <Button className='approve' onClick={approve} disabled={isLoading}>
              {isLoading ? (<><Loading/>Signing...</>)
              : (<><MdCheck/> Sign</>)}
            </Button>
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