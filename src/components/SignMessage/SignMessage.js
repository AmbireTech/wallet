import './SignMessage.scss'
import { FaSignature } from 'react-icons/fa'
import { toUtf8String } from 'ethers/lib/utils'

export default function SignMessage ({ toSign, resolve, selectedAcc }) {
  if (!toSign) return (<></>)

  const approve = async () => {
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