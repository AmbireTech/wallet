import './Security.scss'

import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import accountPresets from '../../../consts/accountPresets'
import privilegesOptions from '../../../consts/privilegesOptions'
import { useRelayerData } from '../../../hooks'
import AddAuthSigner from './AddAuthSigner/AddAuthSigner'
import { useToasts } from '../../../hooks/toasts'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addRequest,
  onAddAccount,
}) => {
  const { data, errMsg, isLoading } = useRelayerData(
    relayerURL
      ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges`
      : null
  )
  const privileges = data ? data.privileges : {}
  const { addToast } = useToasts()

  console.log('privileges', privileges)

  const craftTransaction = (address, privLevel) => {
    return {
      to: selectedAcc,
      data: IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
        address,
        privLevel,
      ]),
      value: '0',
    }
  }

  const addTransactionToAddRequest = txn => {
    try {
      addRequest({
        id: `setPriv_${txn.data}`,
        type: 'eth_sendTransaction',
        txn: txn,
        chainId: selectedNetwork.chainId,
        account: selectedAcc,
      })
    } catch(err) {
        console.error(err)
        addToast(`Error: ${err.message || err}`, { error: true })
    }
  }

  const onMakeDefaultBtnClicked = key => {
    // @TODO
  }

  const onRemoveBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.false)
    addTransactionToAddRequest(txn)
  }

  const onAddBtnClickedHandler = (newSignerAddress) => {
    const txn = craftTransaction(newSignerAddress, privilegesOptions.true)
    addTransactionToAddRequest(txn)
  }

  const selectedAccount = accounts.find(x => x.id === selectedAcc)
  
  const privList = Object.entries(privileges)
    .map(([addr, privValue]) => {
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
          <TextInput className="depositAddress" value={privText} disabled />
          <div className="btns-wrapper">
            <Button
              disabled={isSelected}
              onClick={() => onMakeDefaultBtnClicked(addr)}
              small
            >
              {isSelected ? 'Current signer' : 'Make default'}
            </Button>
            <Button
              onClick={() => onRemoveBtnClicked(addr)}
              small
              red
              title={
                isSelected ? 'Cannot remove the currently used signer' : ''
              }
              disabled={isSelected}
            >
              Remove
            </Button>
          </div>
        </li>
      )
    })
    .filter(x => x)

  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook/service
  // and aggregate from that
  if (!relayerURL)
    return (
      <section id="security">
        <h3 className="error">
          Unsupported: not currently connected to a relayer.
        </h3>
      </section>
    )
  return (
    <section id="security">
      <div className="panel">
        <div className="panel-title">Authorized signers</div>
        {errMsg && (
          <h3 className="error">Error getting authorized signers: {errMsg}</h3>
        )}
        {isLoading && <Loading />}
        <ul className="content">{!isLoading && privList}</ul>
      </div>
      <div className="panel">
        <div className="panel-title">Add new signer</div>
        <AddAuthSigner onAddBtnClicked={onAddBtnClickedHandler} />
      </div>
    </section>
  )
}

export default Security
