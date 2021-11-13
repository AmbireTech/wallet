import './Security.scss'

import { usePrivileges } from '../../../hooks'
import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import privilegesOptions from '../../../consts/privilegesOptions'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Security = ({ relayerURL, selectedAcc, selectedNetwork, accounts, addRequest }) => {
  const { privileges, errMsg, isLoading } = usePrivileges({
    identity: selectedAcc,
    network: selectedNetwork.id,
    relayerURL
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

  const privList = Object.keys(privileges).map(key => {
    const isQuickAcc = selectedAccount.signer.hasOwnProperty('quickAccManager')
    const privText = isQuickAcc
      ? `Email/passphrase signer ${selectedAccount.email}`
      : key
    const signerAddress = isQuickAcc
      ? selectedAccount.signer.quickAccManager
      : selectedAccount.signer.address
    const isSelected = signerAddress === key

    return (
      <li key={key}>
        <TextInput className="depositAddress" value={privText} disabled />
        <div className="btns-wrapper">
          {!isSelected && (<Button onClick={() => onMakeDefaultBtnClicked(key)} small>
            Make default
          </Button>)}
          <Button
            onClick={() => onRemoveBtnClicked(key)}
            small
            red
            disabled={isSelected}
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
        <div className="title">Authorized signers</div>
        {errMsg && (<h3 className='error'>{errMsg}</h3>)}
        {isLoading && <Loading />}
        <ul className="content">{!isLoading && privList}</ul>
      </div>
    </section>
  )
}

export default Security
