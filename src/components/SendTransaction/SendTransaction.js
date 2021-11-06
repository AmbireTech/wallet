//import { GrInspect } from 'react-icons/gr'
// GiObservatory is also interesting
import { GiTakeMyMoney, GiSpectacles } from 'react-icons/gi'
import { FaSignature } from 'react-icons/fa'
import { getTransactionSummary, getBundleShortSummary } from '../../lib/humanReadableTransactions'
import './SendTransaction.css'
import { useEffect, useState } from 'react'

// @TODO get rid of these, should be in the SignTransaction component
import fetch from 'node-fetch'
import { Bundle } from 'adex-protocol-eth/js'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers, getDefaultProvider } from 'ethers'
import { useHistory } from 'react-router'

export default function SendTransaction ({ accounts, network, selectedAcc, requests, resolveMany, relayerURL }) {
  // Note: this one is temporary until we figure out how to manage a queue of those
  const [userAction, setUserAction] = useState(null)
  const [estimation, setEstimation] = useState(null)
  const history = useHistory()

  const onCallRequest = async (payload, wcConnector) => {
    // @TODO handle more
    if (payload.method !== 'eth_sendTransaction') {
      console.log('unsupported method', payload)
      return
    }
    // @TODO filter requests
    // @TODO show error for this
    //if (request.chainId !== network.chainId) return

    const txnFrom = payload.params[0].from
    const account = accounts.find(x => x.id.toLowerCase() === txnFrom.toLowerCase())
    // @TODO check if this account is currently in accounts, send a toast if not
    if (!account) {
      return
    }
    console.log('call onCallRequest, with account: ', account, payload)

    const rawTxn = payload.params[0]
    // @TODO: add a subtransaction that's supposed to `simulate` the fee payment so that
    // we factor in the gas for that; it's ok even if that txn ends up being
    // more expensive (eg because user chose to pay in native token), cause we stay on the safe (higher) side
    // or just add a fixed premium on gasLimit
    const bundle = new Bundle({
      network: network.id,
      identity: account.id,
      // @TODO: take the gasLimit from the rawTxn
      // @TODO "|| '0x'" where applicable
      txns: [[rawTxn.to, rawTxn.value, rawTxn.data]],
      signer: account.signer
    })
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission(function(status) {  // status is "granted", if accepted by user
        // @TODO parse transaction and actually show what we're signing
        if (status !== 'granted') return
         /*var n = */new Notification('Ambire Wallet: new transaction request', { 
          body: `${getBundleShortSummary(bundle)}`,
          requireInteraction: true
          //icon: '/path/to/icon.png' // optional
        })
      })
    }
  
    const provider = getDefaultProvider(network.rpc)
    const estimation = await bundle.estimate({ relayerURL, fetch })
    setEstimation(estimation)
    if (!estimation.success) {
      // @TODO err handling here
      console.error('estimation error', estimation)
      return
    }
    // pay a fee to the relayer
    bundle.txns.push(['0x942f9CE5D9a33a82F88D233AEb3292E680230348', Math.round(estimation.feeInNative.fast*1e18).toString(10), '0x'])
    await bundle.getNonce(provider)

    setUserAction({
      bundle,
      estimation,
      fn: async () => {
        // @TODO we have to cache `providerTrezor` otherwise it will always ask us whether we wanna expose the pub key
        const providerTrezor = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
        // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
        // as for Trezor/ledger, alternatively we can shim using https://www.npmjs.com/package/web3-provider-engine and then wrap in Web3Provider
        const walletShim = {
          signMessage: hash => providerTrezor.signPersonalMessageAsync(ethers.utils.hexlify(hash), bundle.signer.address)
        }
        await bundle.sign(walletShim)
        const bundleResult = await bundle.submit({ relayerURL, fetch })
        console.log(bundleResult)
        console.log(providerTrezor._initialDerivedKeyInfo)
        wcConnector.approveRequest({
          id: payload.id,
          result: bundleResult.txId,
        })
        // we can now approveRequest in this and return the proper result
      }
    })
  }

  // temp hack
  useEffect(() => {
    setEstimation(null)
    if (requests.length) onCallRequest(requests[0])
  }, [requests])

   const rejectButton= (
        <button className='rejectTxn' onClick={() => {
            resolveMany(requests.map(x => x.id))
            history.goBack()
        }}>Reject</button>
   )
   const actionable =
        (estimation && !estimation.success)
        ? (<>
            <h2 className='error'> The current transaction cannot be broadcasted because it will fail: {estimation.message}</h2>
            {rejectButton}
            </>)
        : (userAction ? (<div>
            {rejectButton}
            <button onClick={userAction.fn}>Sign and send</button>
        </div>) : (<></>))

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
                            {userAction ? userAction.bundle.txns.map((txn, i) => (
                                <li key={txn}>
                                    {i === userAction.bundle.txns.length - 1 ? 'Fee: ' : ''}
                                    {getTransactionSummary(txn, userAction.bundle)}
                                </li>
                            )) : (<></>)}
                        </ul>
                </div>
            </div>
            <div className="secondaryPanel">
                <div className="panel">
                    <div className="heading">
                            <div className="title">
                                <GiTakeMyMoney size={35}/>
                                Fee
                            </div>
                            {
                                (estimation && estimation.feeInUSD) ? (
                                    <div className="fees">
                                        <div className="feeSquare"><div className="speed">Slow</div>${estimation.feeInUSD.slow}</div>
                                        <div className="feeSquare"><div className="speed">Medium</div>${estimation.feeInUSD.medium}</div>
                                        <div className="feeSquare selected"><div className="speed">Fast</div>${estimation.feeInUSD.fast}</div>
                                        <div className="feeSquare"><div className="speed">Ape</div>${estimation.feeInUSD.ape}</div>
                                    </div>
                                )
                                : (<></>)
                            }
                            <span style={{ marginTop: '1em' }}>Fee currency</span>
                            <select defaultValue="USDT">
                                <option>USDT</option>
                                <option>USDC</option>
                            </select>
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