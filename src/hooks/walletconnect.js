import { useState, useCallback, useEffect } from 'react'

import WalletConnectCore from '@walletconnect/core'
import * as cryptoLib from "@walletconnect/iso-crypto"
// @TODO get rid of these, should be in the SignTransaction component
import { Bundle } from 'adex-protocol-eth/js'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { ethers, getDefaultProvider } from 'ethers'

// @TODO temporary, this won't be used, we need it in SignTransaction
const relayerURL = 'http://localhost:1934'

const noop = () => null
const noopSessionStorage = { setSession: noop, getSession: noop, removeSession: noop }

const STORAGE_KEY = 'wc1_connections'

export default function  useWalletConnect ({ selectedAcc, chainId }) {
  const [userAction, setUserAction] = useState(null)

  // Store connections
  const [connections, setConnections] = useState([])
  const addConnection = useCallback(conn => {
      const newConns = [...connections, conn]
      // Using the previous state from setConnections itself cause otherwise we have closure/capturing
      // clusterfuck
      setConnections(connections => {
        const newConns = [...connections, conn]
        localStorage[STORAGE_KEY] = JSON.stringify(newConns)
        return newConns
      })
  }, [connections])

  // Restore connections
  useEffect(() => {
      try {
          const conns = JSON.parse(localStorage[STORAGE_KEY] || '[]')
          conns.forEach(conn => wcConnect(conn)) // conn is {uri, session}
          setConnections(conns)
      } catch(e) {
          console.error('Unable to load initial connections', e)
      }
  }, [])

  const wcDisconnect = useCallback(async () => {
    //if (connector) connector.killSession()
    // @TODO: remove from sessions
}, [])

  const wcConnect = useCallback(
    async (connectorOpts) => {
      const wcConnector = new WalletConnectCore({
          connectorOpts,
          cryptoLib,
          sessionStorage: noopSessionStorage
      })

      wcConnector.on('session_request', (error, payload) => {
        // NOTE: we can detect anomalies here: if `session` was passed in connectorOpts, session_request must not happen!
        console.log('wc session request; here we get the client data', payload)

        wcConnector.approveSession({
          accounts: [selectedAcc],
          chainId: chainId,
        })

        // It's safe to store it here right after approveSession because 1) approveSession itself normally stores the session itself
        // 2) connector.session is a getter that re-reads private properties of the connector; those properties are updated immediately at approveSession
        addConnection({ session: wcConnector.session, uri: connectorOpts.uri })
      })

      wcConnector.on('call_request', async (error, payload) => {
        console.log(error, payload)
        if (error) {
          throw error;
        }

        try {
          let result = '0x';

          switch (payload.method) {
            case 'eth_sendTransaction': {
              // @TODO network specific
              const provider = getDefaultProvider('https://polygon-rpc.com/rpc')
              const rawTxn = payload.params[0]
              // @TODO: add a subtransaction that's supposed to `simulate` the fee payment so that
              // we factor in the gas for that; it's ok even if that txn ends up being
              // more expensive (eg because user chose to pay in native token), cause we stay on the safe (higher) side
              // or just add a fixed premium on gasLimit
              const bundle = new Bundle({
                network: 'polygon', // @TODO
                identity: selectedAcc,
                // @TODO: take the gasLimit from the rawTxn
                // @TODO "|| '0x'" where applicable
                txns: [[rawTxn.to, rawTxn.value, rawTxn.data]],
                signer: { address: localStorage.tempSigner } // @TODO
              })
              const estimation = await bundle.estimate({ relayerURL, fetch: window.fetch })
              console.log(estimation)
              console.log(bundle.gasLimit)
              bundle.txns.push(['0x942f9CE5D9a33a82F88D233AEb3292E680230348', Math.round(estimation.feeInNative.fast*1e18).toString(10), '0x'])
              await bundle.getNonce(provider)
              console.log(bundle.nonce)

              setUserAction({
                bundle,
                fn: async () => {
                  // @TODO we have to cache `providerTrezor` otherwise it will always ask us whether we wanna expose the pub key
                  const providerTrezor = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
                  // NOTE: for metamask, use `const provider = new ethers.providers.Web3Provider(window.ethereum)`
                  // as for Trezor/ledger, alternatively we can shim using https://www.npmjs.com/package/web3-provider-engine and then wrap in Web3Provider
                  const walletShim = {
                    signMessage: hash => providerTrezor.signPersonalMessageAsync(ethers.utils.hexlify(hash), bundle.signer.address)
                  }
                  await bundle.sign(walletShim)
                  console.log('post sig')
                  console.log(await bundle.submit({ relayerURL, fetch: window.fetch }))

                  // we can now approveRequest in this and return the proper result
                }
              })
              // @TODO relayerless mode
              break;
            }
            case 'gs_multi_send': {
              // @TODO WC
              break;
            }

            case 'personal_sign': {
              // @TODO WC
              break;
            }

            case 'eth_sign': {
              // @TODO WC
              // this can be handled the same way as personal_sign; reference: https://github.com/gnosis/safe-react-apps/blob/main/apps/wallet-connect/src/hooks/useWalletConnect.tsx
              break;
            }
            default: {
              wcConnector.rejectRequest({ id: payload.id, error: { message: 'METHOD_NOT_SUPPORTED' }});
              break;
            }
          }

          wcConnector.approveRequest({
            id: payload.id,
            result,
          })
        } catch (err) {
          wcConnector.rejectRequest({ id: payload.id, error: { message: err.message }})
        }
      })

      wcConnector.on('disconnect', (error, payload) => {
        console.log('disconnect request', payload)
        if (error) throw error
        wcDisconnect()
      })
    }, [selectedAcc, chainId, setUserAction, addConnection, connections])

  return { connections, wcConnect, wcDisconnect, userAction }
}
