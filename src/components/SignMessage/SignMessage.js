import './SignMessage.scss'
import { FaSignature } from 'react-icons/fa'
import { toUtf8String, keccak256, arrayify } from 'ethers/lib/utils'
import { signMsgHash } from 'adex-protocol-eth/js/Bundle'
import { getWallet } from '../../lib/getWallet'
import { useToasts } from '../../hooks/toasts'

export default function SignMessage ({ toSign, resolve, account }) {
  const { addToast } = useToasts()

  if (!toSign || !account) return (<></>)

  const approve = async () => {
    // @TODO quickAccount support
    if (account.signer.quickAccManager) {
      addToast('email/pass accounts not supported yet', { error: true })
      return
    }
    const wallet = getWallet({
      signer: account.signer,
      signerExtra: account.signerExtra,
      chainId: 1 // does not matter
    })

    const hashToSign = keccak256(arrayify(toSign.txn))
    try {
      const sig = await signMsgHash(wallet, account.id, account.signer, hashToSign)
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

        </div>
    </div>
  </div>)
}

function getMessageAsText(msg) {
  try { return toUtf8String(msg) }
  catch(_) { return msg }
}