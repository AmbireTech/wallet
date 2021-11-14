import './Security.scss'

import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import accountPresets from '../../../consts/accountPresets'
import privilegesOptions from '../../../consts/privilegesOptions'
import { useRelayerData } from '../../../hooks'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Security = ({ relayerURL, selectedAcc, selectedNetwork, accounts, addRequest }) => {
  const { data, errMsg, isLoading } = useRelayerData(relayerURL ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges` : null)
  const privileges = data ? data.privileges : {}

  const craftTransaction = (address, privLevel) => {
    return {
      to: selectedAcc,
      data: IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
        address,
        privLevel,
      ]),
      value: '0x',
    }
  }

  const addTransactionToAddRequest = txn => {
    addRequest({
      id: `setPriv_${txn.data}`,
      txn: txn,
      chainId: selectedNetwork.chainId,
      account: selectedAcc,
    })
  }

  const onMakeDefaultBtnClicked = key => {
    // @TODO
  }

  const onRemoveBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.false)
    addTransactionToAddRequest(txn)
  }

  const selectedAccount = accounts.find(x => x.id === selectedAcc)

  const privList = Object.entries(privileges).map(([addr, privValue]) => {
    if (!privValue) return null
    const isQuickAcc = addr === accountPresets.quickAccManager
    const privText = isQuickAcc
      ? `Email/passphrase signer (${selectedAccount.email})`
      : addr
    const signerAddress = isQuickAcc
      ? selectedAccount.signer.quickAccManager
      : selectedAccount.signer.address
    const isSelected = signerAddress === addr

    return (
      <li key={addr}>
        <TextInput className='depositAddress' value={privText} disabled />
        <div className='btns-wrapper'>
          <Button disabled={isSelected} onClick={() => onMakeDefaultBtnClicked(addr)} small>
            {isSelected ? 'Current signer' : 'Make default'}
          </Button>
          <Button
            onClick={() => onRemoveBtnClicked(addr)}
            small
            red
            title={isSelected ? 'Cannot remove the currently used signer' : ''}
            disabled={isSelected}
          >
            Remove
          </Button>
        </div>
      </li>
    )
  }).filter(x => x)

  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook
  // and aggregate from that
  if (!relayerURL) return (<section id='security'>
    <h3 className='error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)
  return (
    <section id='security'>
      <div className='panel'>
        <div className='title'>Authorized signers</div>
        {errMsg && (<h3 className='error'>Error getting authorized signers: {errMsg}</h3>)}
        {isLoading && <Loading />}
        <ul className='content'>{!isLoading && privList}</ul>
      </div>
    </section>
  )
}

export default Security
