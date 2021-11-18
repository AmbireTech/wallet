import './SignMessage.scss'
import { FaSignature } from 'react-icons/fa'
import { toUtf8String/*, keccak256*/, arrayify } from 'ethers/lib/utils'
import { signMsgHash } from 'adex-protocol-eth/js/Bundle'
import { getWallet } from '../../lib/getWallet'
import { useToasts } from '../../hooks/toasts'
import { fetchPost } from '../../lib/fetch'
import { useState } from 'react'

export default function SignMessage ({ toSign, resolve, account, relayerURL }) {
  const defaultState = () => ({ codeRequired: false, passphrase: '', code: '' })
  const { addToast } = useToasts()
  const [signingState, setSigningState] = useState(defaultState())

  if (!toSign || !account) return (<></>)

  const approveQuickAcc = async () => {
    if (!relayerURL) {
      addToast('Email/pass accounts not supported without a relayer connection', { error: true })
      return
    }
    try {
      console.log(signingState)
      //  const wallet = await Wallet.fromEncryptedJson(JSON.parse(account.primaryKeyBackup), pwd)

      const { signature, success, message, confCodeRequired } = await fetchPost(
          // network doesn't matter when signing
        `${relayerURL}/second-key/${account.id}/ethereum/sign`, {
          signer: account.signer,
          toSign: toSign.txn,
          code: signingState.code
        }
      )
      if (!success) {
        if (!message) throw new Error(`Secondary key: no success but no error message`)
        if (message.includes('invalid confirmation code')) {
          addToast('Unable to sign: wrong confirmation code', { error: true })
        }
        addToast(`Second signature error: ${message}`)
        return
      }
      if (confCodeRequired) {
        setSigningState({ codeRequired: true })
        return
      }
      console.log(signature, success, message)
    } catch(e) {
      console.error('Relayer error', e)
      addToast(`Relayer error: ${e.message || e}`, { error: true })
      return
    }
  }
  const approve = async () => {
    if (account.signer.quickAccManager) {
      await approveQuickAcc()
      return
    }

    // if quick account, wallet = await fromEncryptedBackup
    // and just pass the signature as secondSig to signMsgHash
    const wallet = getWallet({
      signer: account.signer,
      signerExtra: account.signerExtra,
      chainId: 1 // does not matter
    })
    // NOTE: doesn't need to be a hash, it's msgOrHash actually (https://docs.ethers.io/v5/api/signer/#Signer-signMessage)
    // The benefit of passing the full binary data is that web3 wallets/hw wallets can display the full text
    // const hashToSign = keccak256(arrayify(toSign.txn))
    try {
      const sig = await signMsgHash(wallet, account.id, account.signer, arrayify(toSign.txn))
      resolve({ success: true, result: sig })
    } catch(e) {
      console.error(e)
      addToast(`Signing error: ${e.message || e}`, { error: true })
    }
  }

  return (<div id='signMessage'>
    <div className='panel'>
        <div className='heading'>
            <div className='title'>
                <FaSignature size={35}/>
                Sign message
            </div>
        </div>

        <textarea
          className='message'
          type='text'
          value={getMessageAsText(toSign.txn)}
          readOnly={true}
        />

        <div className='actions'>
          <button type='button' className='reject' onClick={() => resolve({ message: 'signature denied' })}>Reject</button>
          <button type='button' className='approve' onClick={approve}>Sign</button>

          {signingState.codeRequired && (<>
            <input type='password'
              required minLength={3}
              placeholder='Password'
              value={signingState.passphrase}
              onChange={e => setSigningState({ ...signingState, passphrase: e.target.value })}
            ></input>
            <input
              type='text' pattern='[0-9]+'
              title='Confirmation code should be 6 digits'
              autoComplete='nope'
              required minLength={6} maxLength={6}
              value={signingState.code}
              onChange={e => setSigningState({ ...signingState, code: e.target.value })}
              placeholder='Confirmation code'></input>
            <button onClick={() => { setSigningState(defaultState()); approve() }}>resend</button>
          </>)}
        </div>
    </div>
  </div>)
}

function getMessageAsText(msg) {
  try { return toUtf8String(msg) }
  catch(_) { return msg }
}