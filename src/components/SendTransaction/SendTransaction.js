//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature } from 'react-icons/fa'
import { getTransactionSummary, getBundleShortSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { Loading } from '../common'
import { useEffect, useState } from 'react'

// @TODO get rid of these, should be in the SignTransaction component
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers, getDefaultProvider } from 'ethers'
import { useHistory } from 'react-router'
import { useToasts } from '../../hooks/toasts'
import HDNode from 'hdkey'

function notifyUser (bundle) {
  if (window.Notification && Notification.permission !== 'denied') {
    Notification.requestPermission(status => {  // status is "granted", if accepted by user
      if (status !== 'granted') return
       /*var n = */new Notification('Ambire Wallet: new transaction request', {
        body: `${getBundleShortSummary(bundle)}`,
        requireInteraction: true
        //icon: '/path/to/icon.png' // optional
      })
    })
  }
}

function toBundleTxn({ to, value, data }) {
  return [to, value || '0x0', data || '0x']
}

function makeBundle(account, networkId, requests) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    txns: requests.map(({ txn }) => toBundleTxn(txn)),
    signer: account.signer
  })
  bundle.requestIds = requests.map(x => x.id)
  return bundle
}

export default function SendTransaction ({ accounts, network, selectedAcc, requests, resolveMany, relayerURL }) {
  const [frozenBundle, setFrozenBundle] = useState(null)
  const [estimation, setEstimation] = useState(null)
  const history = useHistory()
  const { addToast } = useToasts()

  // Also filtered in App.js, but better safe than sorry here
  const eligibleRequests = requests
    .filter(({ type, chainId, account, txn }) =>
      type === 'eth_sendTransaction'
      && chainId === network.chainId
      && account === selectedAcc
      && txn && (!txn.from || txn.from.toLowerCase() === selectedAcc.toLowerCase())
    )
  useEffect(() => {
    if (estimation) setEstimation(null)
    if (!eligibleRequests.length) return
    // Notify the user with the latest bundle
    notifyUser(bundle)

    // get latest estimation
    bundle.estimate({ relayerURL, fetch })
      .then(setEstimation)
      // @TODO catch
  }, [eligibleRequests.length])

  if (!selectedAcc) return (<h3 className='error'>No selected account</h3>)

  const account = accounts.find(x => x.id === selectedAcc)
  if (!account) throw new Error('internal: account does not exist')

  // @TODO
  // add a transaction that's supposed to `simulate` the fee payment so that
  // we factor in the gas for that; it's ok even if that txn ends up being
  // more expensive (eg because user chose to pay in native token), cause we stay on the safe (higher) side
  // or just add a fixed premium on gasLimit
  // or just hardcode a certain gas limit
  const bundle = frozenBundle || makeBundle(account, network.id, eligibleRequests)

  const approveTxnImpl = async () => {
    if (!estimation) return
    // pay a fee to the relayer
    bundle.txns.push(['0x942f9CE5D9a33a82F88D233AEb3292E680230348', Math.round(estimation.feeInNative.fast*1e18).toString(10), '0x'])
    const provider = getDefaultProvider(network.rpc)
    await bundle.getNonce(provider)

    bundle.gasLimit = estimation.gasLimit

    // @TODO we have to cache `providerTrezor` otherwise it will always ask us whether we wanna expose the pub key
    const providerTrezor = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
    // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
    // as for Trezor/ledger, alternatively we can shim using https://www.npmjs.com/package/web3-provider-engine and then wrap in Web3Provider
    const walletShim = {
      signMessage: hash => providerTrezor.signPersonalMessageAsync(ethers.utils.hexlify(hash), bundle.signer.address)
    }
    providerTrezor._initialDerivedKeyInfo = {
      "hdKey": HDNode.fromExtendedKey(localStorage.xpub),
      "derivationPath":"m/44'/60'/0'/0",
      "baseDerivationPath":"44'/60'/0'/0"
    }
    await bundle.sign(walletShim)
    const bundleResult = await bundle.submit({ relayerURL, fetch })
    console.log(bundle, bundleResult)
    //console.log(JSON.stringify(providerTrezor._initialDerivedKeyInfo), providerTrezor._initialDerivedKeyInfo)
    resolveMany(bundle.requestIds, { success: bundleResult.success, result: bundleResult.txId, message: bundleResult.message })
    // we can now approveRequest in this and return the proper result
    // @TODO show a success toast with a URL to a block scanner
  }
  const approveTxn = () => {
    approveTxnImpl()
      .catch(e => {
        console.error(e)
        addToast(`Signing error: ${e.message || e}`)
      })
  }

  const rejectButton = (
      <button className='rejectTxn' onClick={() => {
          resolveMany(requests.map(x => x.id), { message: 'rejected' })
          history.goBack()
      }}>Reject</button>
  )

  const actionable =
      (estimation && !estimation.success)
      ? (<>
          <h2 className='error'> The current transaction cannot be broadcasted because it will fail: {estimation.message}</h2>
          {rejectButton}
          </>)
      : (<div>
          {rejectButton}
          <button disabled={!estimation} onClick={approveTxn}>Sign and send</button>
      </div>)

  return (<div id="sendTransaction">
      <h2>Pending transaction</h2>
      <div className="panelHolder">
          <div className="panel">
              <div className="heading">
                      <div className="title">
                          <GiSpectacles size={35}/>
                          Transaction summary
                      </div>
                      <ul>
                          {bundle.txns.map(txn => (
                              <li key={txn}>
                                  {getTransactionSummary(txn, bundle)}
                              </li>
                          ))}
                      </ul>
                      <span>
                          <b>NOTE:</b> Transaction batching is enabled, you're signing {eligibleRequests.length} transactions at once. You can add more transactions to this batch by interacting with a connected dApp right now.
                      </span>
              </div>
          </div>
          <div className="secondaryPanel">
              <div className="panel feePanel">
                  <div className="heading">
                          <div className="title">
                              <GiTakeMyMoney size={35}/>
                              Fee
                          </div>
                          {
                              (estimation && estimation.feeInUSD) ? (<>
                                <span style={{ marginTop: '1em' }}>Fee currency</span>
                                <select defaultValue="USDT">
                                    <option>USDT</option>
                                    <option>USDC</option>
                                </select>
                                  <div className="fees">
                                      <div className="feeSquare"><div className="speed">Slow</div>${estimation.feeInUSD.slow}</div>
                                      <div className="feeSquare"><div className="speed">Medium</div>${estimation.feeInUSD.medium}</div>
                                      <div className="feeSquare selected"><div className="speed">Fast</div>${estimation.feeInUSD.fast}</div>
                                      <div className="feeSquare"><div className="speed">Ape</div>${estimation.feeInUSD.ape}</div>
                                  </div>
                              </>)
                              : (<Loading/>)
                          }

                  </div>
              </div>
              <div className="panel">
                  <div className="heading">
                      <div className="title">
                          <FaSignature size={35}/>
                          Sign
                      </div>
                  </div>
                  {actionable}
              </div>
          </div>
      </div>
  </div>)
}