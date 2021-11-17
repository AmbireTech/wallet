import './SignMessage.scss'
import { FaSignature } from 'react-icons/fa'
import { toUtf8String/*, keccak256*/, arrayify } from 'ethers/lib/utils'
import { signMsgHash } from 'adex-protocol-eth/js/Bundle'
import { getWallet } from '../../lib/getWallet'
import { useToasts } from '../../hooks/toasts'

export default function SignMessage ({ toSign, resolve, account }) {
  const { addToast } = useToasts()

  // @TODO state for the confirmation code

  if (!toSign || !account) return (<></>)

  const approve = async () => {
    // @TODO quickAccount support
    if (account.signer.quickAccManager) {
      // pull the confirmation code 
      // @TODO
      addToast('email/pass accounts not supported yet', { error: true })
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

          {/*
          <input type='password' required minLength={3} placeholder='Password'></input>
          <input
            type='text' pattern='[0-9]+'
            title='Confirmation code should be 6 digits'
            autoComplete='nope'
            required minLength={6} maxLength={6}
            placeholder='Confirmation code'></input>
          */}
        </div>
    </div>
  </div>)
}

function getMessageAsText(msg) {
  try { return toUtf8String(msg) }
  catch(_) { return msg }
}