import './DAppIncompatibilityWarningMsg.scss'

import { IoIosWarning } from 'react-icons/io'

export default function DAppIncompatibilityWarningMsg(
  {
    title = 'Warning',
    msg = 'It is highly likely that this dapp does not support smart wallet signatures. This is a highly disruptive practice, as it breaks support for all smart wallets (Ambire, Gnosis Safe and others). We recommend you report this to the dApp ASAP and ask them to fix it.'
  }) {
    return (<div id='dangerMsg'>
    <div className='err-title'><IoIosWarning/>{ title }</div>
    <div className='error-message'>{ msg }</div>
  </div>) 
}