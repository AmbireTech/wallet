import {useCallback, useEffect, useReducer, useRef, useMemo} from 'react'
import {useToasts} from '../hooks/toasts'

import {Methods} from '@gnosis.pm/safe-apps-sdk'
import {GnosisConnector} from '../lib/GnosisConnector'
import {usePortfolio} from './index'
import {getDefaultProvider} from 'ethers'

const STORAGE_KEY = 'gnosis_safe_state'

const getDefaultState = () => ({requests: []})

export default function useGnosisSafe({selectedAccount, network, verbose}) {

  verbose = verbose || 0;

  const connector = useRef(null);

  const uniqueId = useMemo(() => new Date().getTime() + ' ' + network.chainId + ' ' + selectedAccount, [selectedAccount, network]);

  const {addToast} = useToasts()

  const portfolio = usePortfolio({
    currentNetwork: network.id,
    account: selectedAccount
  });

  // This is needed cause of the WalletConnect event handlers
  const stateRef = useRef()
  stateRef.current = {selectedAccount, network}

  const [state, dispatch] = useReducer((state, action) => {
    if (action.type === 'requestAdded') {
      return {...state, requests: [...state.requests, action.request]}
    }
    if (action.type === 'requestsResolved') {
      return {
        ...state,
        requests: state.requests.filter(x => !action.ids.includes(x.id))
      }
    }
    return {...state}
  }, null, () => {
    const json = localStorage[STORAGE_KEY]
    if (!json) return getDefaultState()
    try {
      return {
        ...getDefaultState(),
        ...JSON.parse(json)
      }
    } catch (e) {
      console.error(e)
      return getDefaultState()
    }
  })

  const connect = useCallback(connectorOpts => {

    verbose>1 && console.log("GS: creating connector");

    const getSafeInfo = () => {
      return {
        safeAddress: selectedAccount,
        network: network.id,
        chainId: network.chainId,
        owners: [selectedAccount],
        threshold: 1,//Number of confirmations (not used in ambire)
      }
    }

    const getSafeBalances = async () => {

      //TODO later
      //await portfolio.updatePortfolio("polygon", selectedAccount, true);//not this because it does NOT return the updated state anyway
      //console.log(portfolio);

      //struct template
      /*return {
        "fiatTotal": "0.18072",
          "items": [
          {
            "tokenInfo": {
              "type": "NATIVE_TOKEN",
              "address": "0x0000000000000000000000000000000000000000",
              "decimals": 18,
              "symbol": "MATIC",
              "name": "Matic",
              "logoUri": "https://safe-transaction-assets.staging.gnosisdev.com/chains/137/currency_logo.png"
            },
            "balance": "100000000000000000",
            "fiatBalance": "0.18072",
            "fiatConversion": "1.8072"
          }
        ]
      }*/

    }

    try {
      connector.current = new GnosisConnector(
        connectorOpts.iframeRef,
        connectorOpts.app,
        uniqueId
      )
    } catch (e) {
      addToast(`Unable to connect to ${connectorOpts.app.url}: ${e.message}`)
      return null
    }

    //reply back to iframe with safe data
    connector.current.on(Methods.getSafeInfo, () => {
      return getSafeInfo()
    })

    //reply back to iframe with safe data
    connector.current.on(Methods.getSafeBalances, async (msg) => {
      verbose>0 && console.log("DApp requested getSafeBalances") && console.log(msg);
      return await getSafeBalances();
    })

    connector.current.on(Methods.rpcCall, async (msg) => {

      verbose>0 && console.log("DApp requested rpcCall") && console.log(msg);

      if(!msg?.data?.params){
        throw new Error("invalid call object");
      }
      const method = msg.data.params.call;//0 == tx, 1 == blockNum
      const callTx = msg.data.params.params;//0 == tx, 1 == blockNum

      const provider = getDefaultProvider(network.rpc);
      let result;
      if(method === "eth_call"){
        result = await provider.call(callTx[0], callTx[1]).catch(err => {
          throw err;
        });
      }else if(method === "eth_getBalance"){
        result = await provider.getBalance(callTx[0], callTx[1]).catch(err => {
          throw err;
        });
      }else if(method === "eth_getCode"){
        result = await provider.getCode(callTx[0], callTx[1]).catch(err => {
          throw err;
        });
      }else{
        throw new Error("method not supported " + method);
      }
      return result;
    })


    connector.current.on(Methods.sendTransactions, (msg) => {
      verbose>0 && console.log("DApp requested sendTx") && console.log(msg);
      const data = msg?.data
      if (!data) {
        console.error('no data')
        return
      }

      const id = 'gs_' + new Date().getTime() + '_' + data.id
      const txs = data?.params?.txs
      if (txs?.length) {
        for (let i in txs) {
          if (!txs[i].from) txs[i].from = selectedAccount
        }
      } else {
        console.error('no txs in received payload')
      }

      const request = {
        id: id,
        forwardId: msg.data.id,
        type: 'eth_sendTransaction',
        txn: txs[0],//if anyone finds a dapp that sends a bundle, please reach me out
        chainId: network.chainId,
        account: selectedAccount
      }

      dispatch({type: 'requestAdded', request: request})
    })

    return connector.current
  }, [selectedAccount, network, uniqueId, addToast, portfolio])

  const disconnect = useCallback(() => {
    verbose>1 && console.log("GS: disconnecting connector");
    connector.current?.clear();
  }, []);

  const resolveMany = (ids, resolution) => {
    for (let req of state.requests.filter(x => ids.includes(x.id))) {
      const replyData = {
        id: req.forwardId,
        success: null,
        txId:null,
				error:null
      }
      if(!resolution){
        replyData.error = 'Nothing to resolve'
        replyData.success = false
			}else if(!resolution.success){
        replyData.error = resolution.message;
        replyData.success = false
      } else{ //onSuccess
        replyData.success = true;
        replyData.txId = resolution.txId;
      }
      connector.current?.send(replyData, req.forwardId, replyData.error)
    }

    dispatch({type: 'requestsResolved', ids})
  }

  // Side effects that will run on every state change/rerender
  useEffect(() => {
    localStorage[STORAGE_KEY] = JSON.stringify(state)
  }, [state, selectedAccount, network])

  return {
    requests: state.requests,
    resolveMany: resolveMany,
    connect,
    disconnect
  }
}
