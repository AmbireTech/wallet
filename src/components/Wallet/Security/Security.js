import './Security.scss'

import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import accountPresets from '../../../consts/accountPresets'
import privilegesOptions from '../../../consts/privilegesOptions'
import { useRelayerData } from '../../../hooks'
import AddAuthSigner from './AddAuthSigner/AddAuthSigner'
import { useToasts } from '../../../hooks/toasts'
import { hexZeroPad, getAddress } from 'ethers/lib/utils'
import { fetch, fetchPost } from '../../../lib/fetch'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const { generateAddress2 } = require('ethereumjs-util')
const { getProxyDeployBytecode } = require('adex-protocol-eth/js/IdentityProxyDeploy')

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addRequest,
  onAddAccount,
}) => {
  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges`
    : null

  const { data, errMsg, isLoading } = useRelayerData(url)  
  const privileges = data ? data.privileges : {}
  const { addToast } = useToasts()

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
    } catch (err) {
      console.error(err)
      addToast(`Error: ${err.message || err}`, { error: true })
    }
  }

  // const onMakeDefaultBtnClicked = key => {
  //   // @TODO
  // }

  const onRemoveBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.false)
    addTransactionToAddRequest(txn)
  }

  const onAddBtnClickedHandler = newSignerAddress => {
    console.log('newSigner', newSignerAddress)
    // const txn = craftTransaction(newSignerAddress, privilegesOptions.true)
    // addTransactionToAddRequest(txn)
  }

  async function onMakeDefaultBtnClicked (addr, signerExtra) {
    const addAccount = (acc, opts) => onAddAccount({ ...acc, signerExtra }, opts)
    // when there is no relayer, we can only add the 'default' account created from that EOA
    // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
    //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
    if (!relayerURL) return addAccount(await createFromEOA(addr), { select: true })
    // otherwise check which accs we already own and add them
    const owned = await getOwnedByEOAs([addr])
    if (!owned.length) return addAccount(await createFromEOA(addr), { select: true })
    else owned.forEach((acc, i) => addAccount(acc , { select: i === 0 }))
  }

  async function getOwnedByEOAs(eoas) {
    let allUniqueOwned = {}

    await Promise.all(eoas.map(
        async signerAddr => {
            const resp = await fetch(`${relayerURL}/identity/any/by-owner/${signerAddr}?includeFormerlyOwned=true`)
            const privEntries = Object.entries(await resp.json())
            // discard the privileges value, we do not need it as we wanna add all accounts EVER owned by this eoa
            privEntries.forEach(([id, _]) => allUniqueOwned[id] = getAddress(signerAddr))
        }
    ))

    return await Promise.all(
        Object.entries(allUniqueOwned).map(([id, signer]) => getAccountByAddr(id, signer))
    )
}

async function getAccountByAddr (idAddr, signerAddr) {
  // In principle, we need these values to be able to operate in relayerless mode,
  // so we just store them in all cases
  // Plus, in the future this call may be used to retrieve other things
  const { salt, identityFactoryAddr, baseIdentityAddr, bytecode } = await fetch(`${relayerURL}/identity/${idAddr}`)
      .then(r => r.json())
  if (!(salt && identityFactoryAddr && baseIdentityAddr && bytecode)) throw new Error(`Incomplete data from relayer for ${idAddr}`)
  return {
      id: idAddr,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer: { address: signerAddr }
  }
}

async function createFromEOA (addr) {
  const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
  const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
  const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
  const identityAddr = getAddress('0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex'))

  if (relayerURL) {
      const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
          salt, identityFactoryAddr, baseIdentityAddr,
          privileges
      })
      if (!createResp.success && !(createResp.message && createResp.message.includes('already exists'))) throw createResp
  }

  return {
      id: identityAddr,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer: { address: getAddress(addr) }
  }
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
        <AddAuthSigner onAddBtnClicked={onAddBtnClickedHandler} selectedNetwork={selectedNetwork} />
      </div>
    </section>
  )
}

export default Security
