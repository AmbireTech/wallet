import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useToasts } from '../hooks/toasts'

import {Methods} from "@gnosis.pm/safe-apps-sdk"
import {GnosisConnector} from "../lib/GnosisConnector"

const STORAGE_KEY = 'gnosis_safe_state'

const getDefaultState = () => ({ requests: [] })

let connector = null;

// args passed are not reactive?
export default function useGnosisSafe ({ selectedAccount, network }) {

	const uniqueId = new Date().getTime() + " " + selectedAccount;

	const { addToast } = useToasts()
    // This is needed cause of the WalletConnect event handlers
    const stateRef = useRef()
    stateRef.current = { selectedAccount, network }

	const getSafeInfo = () => {
		return {
			safeAddress: selectedAccount,
			network: network.id,
			chainId: network.chainId,
			owners: [selectedAccount],
			threshold: 1,//Number of confirmations (not used in ambire)
		}
	}

    const [state, dispatch] = useReducer((state, action) => {
        if (action.type === 'requestAdded') {
            return { ...state, requests: [...state.requests, action.request] }
        }
        if (action.type === 'requestsResolved') {
            return {
                ...state,
                requests: state.requests.filter(x => !action.ids.includes(x.id))
            }
        }
        return { ...state }
    }, null, () => {
		const json = localStorage[STORAGE_KEY]
		if (!json) return getDefaultState()
		try {
			return {
				...getDefaultState(),
				...JSON.parse(json)
			}
		} catch(e) {
			console.error(e)
			return getDefaultState()
		}
    })

    const connect = useCallback(connectorOpts => {

        //remove all listeners for all existing connectors
		if(connector){
			connector.clear();
		}
		connector = null;
        try {
            connector = new GnosisConnector(
                connectorOpts.iframeRef,
				connectorOpts.app,
				uniqueId
            )
        } catch(e) {
            addToast(`Unable to connect to ${connectorOpts.app.url}: ${e.message}`)
            return null
        }

        //reply back to iframe with safe data
		connector.on(Methods.getSafeInfo, () => {
			return getSafeInfo();
		});

		connector.on(Methods.sendTransactions, (msg) => {
			const data = msg?.data;
			if(!data){
				console.error("no data");
				return;
			}

			const id = "gs_" + new Date().getTime() + "_" + msg.id;
			const txs = data?.params?.txs;
			if(txs?.length){
				for(let i in txs) {
					if(!txs[i].from) txs[i].from = selectedAccount;
				}
			}else{
				console.error("no txs in received payload");
			}

			const payload = {
				id: id,//for internal purposes, different ids to avoid (unlikely) collisions with other ids
				forwardId:msg.data.id,//to send back the proper ID to iframe
				method: "eth_sendTransaction",
				params: txs
			}

			dispatch({ type: 'requestAdded', request: payload })
		});

        return connector
    }, [selectedAccount, network])

    const resolveMany = (ids, resolution) => {
        // @TODO reply to iframe. needs sendTransacion modal
        // then dispatch to remove the requests
		for(let req of state.requests.filter(x => !ids.includes(x.id))){
			const replyData = {
				id: req.forwardId,
				success: true
			};
			if(!resolution){//is this a bool submitted/rejected?
				replyData.error = "Transaction was rejected";
				replyData.success = false;
			}
			connector?.send(replyData, req.forwardId);
		}

        dispatch({ type: 'requestsResolved', ids })
    }

	// Side effects that will run on every state change/rerender
	useEffect(() => { localStorage[STORAGE_KEY] = JSON.stringify(state) }, [state, selectedAccount, network])

    return {
        requests: state.requests,
        resolveMany: resolveMany,
		connect,
    }
}
