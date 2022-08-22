import './DAppIncompatibilityWarningMsg.scss'

import { IoIosWarning } from 'react-icons/io'

export default function DAppIncompatibilityWarningMsg() {
    return (<div id='dangerMsg'>
    <div className='err-title'><IoIosWarning/>Unable to send transaction</div>
    <div className='error-message'>
      We detected that this dApp intentionally blocks smart contract calls. This is a highly disruptive practice, as it breaks support for all smart wallets (Ambire, Gnosis Safe and others). We recommend you report this to the dApp ASAP and ask them to fix it.
    </div>
  </div>) 
}