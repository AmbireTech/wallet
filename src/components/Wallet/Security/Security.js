import './Security.scss'

import { usePrivileges } from '../../../hooks'
import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import privilegesOptions from '../../../consts/privilegesOptions'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Security = ({ selectedAcc, selectedNetwork, accounts, addRequest }) => {
  const { privileges, updatedBlock, isLoading } = usePrivileges({
    identity: selectedAcc,
    network: selectedNetwork.id,
    accounts: accounts,
  })

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
      id: 'setPriv',
      txn: txn,
      chainId: selectedNetwork.chainId,
      account: selectedAcc,
    })
  }

  const onMakeDefaultBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.true)
    addTransactionToAddRequest(txn)

    console.log('Make default', txn)
  }

  const onRemoveBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.false)
    addTransactionToAddRequest(txn)
    console.log('Remove clicked', txn)
  }

  const selectedAccount = accounts.find(x => x.id === selectedAcc)

  const privList = Object.keys(privileges).map(key => {
    console.log('Selected Account', selectedAccount)
    const isQuickAcc = selectedAccount.signer.hasOwnProperty('quickAccManager')
    const privText = isQuickAcc
      ? `Email/passphrase signer ${selectedAccount.email}`
      : key
    const signerAddress = isQuickAcc
      ? selectedAccount.signer.quickAccManager
      : selectedAccount.signer.address
    const disabled = signerAddress === key

    return (
      <li key={key}>
        <TextInput className="depositAddress" value={privText} disabled />
        <div className="btns-wrapper">
          <Button onClick={() => onMakeDefaultBtnClicked(key)} small>
            Make default
          </Button>
          <Button
            onClick={() => onRemoveBtnClicked(key)}
            small
            red
            disabled={disabled}
          >
            Remove
          </Button>
        </div>
      </li>
    )
  })

  return (
    <section id="security">
      <div className="panel">
        <div className="title">Security</div>
        {isLoading && <Loading />}
        {/* Set a msg if no privileges */}
        <ul className="content">{!isLoading && privList}</ul>
      </div>
    </section>
  )
}

export default Security
