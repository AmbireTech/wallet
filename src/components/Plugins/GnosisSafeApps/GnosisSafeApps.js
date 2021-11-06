import { useEffect, useState, useRef, useCallback } from 'react'
import { useIframeMessageHandler } from '../../../hooks/iframeMessageHandler'
import { useAppCommunicator } from '../../../hooks/useAppCommunicator'
import {
	getSDKVersion,
	MessageFormatter,
	Methods
} from '@gnosis.pm/safe-apps-sdk'

export default function GnosisSafeApps ({ network, selectedAcc }) {


	console.log("test test");

	const iframeRef = useRef(null);

	const appUrl = "http://localhost:3002/";

	/*const { sendMessageToIframe } = useIframeMessageHandler({
			address: selectedAcc,
			iframeRef: iframeRef,
			selectedAcc: selectedAcc,
			ethBalance: 69,
			safeName: "testName",
			appUrl: appUrl,
			networkName: "polygon"
	})*/

	const communicator = useAppCommunicator(iframeRef, "test");

	useEffect(() => {

		console.log("USE EFFECT..." + network);
		console.log(selectedAcc);

		communicator?.on('getEnvInfo', () => ({
			txServiceUrl: "http://todo.com",//TODO
		}))

		communicator?.on(Methods.getTxBySafeTxHash, async (msg) => {
			const { safeTxHash } = msg.data.params

			console.log("Implement getTxBySafeTxHash");

			//const tx = await fetchSafeTransaction(safeTxHash)

			return {"hash": "test"};
		})

		communicator?.on(Methods.getSafeInfo, () => {
			debugger;
			const r = {
				selectedAcc,
				network: "polygon",//TODO
				chainId: network,
				owners: [selectedAcc],
				threshold: 0,
				test:"lol"
			}
			return r
		});

		communicator?.on(Methods.getSafeBalances, async (msg) => {
			const { currency = 'usd' } = msg.data.params

			//const balances = await fetchTokenCurrenciesBalances({ safeAddress, selectedCurrency: currency })

			return [];
		})

		communicator?.on(Methods.rpcCall, async (msg) => {
			const params = msg.data.params

			try {
				const response = new Promise((resolve, reject) => {
					console.log("send web3 stuff");
					/*safeAppWeb3Provider.send(
						{
							jsonrpc: '2.0',
							method: params.call,
							params: params.params,
							id: '1',
						},
						(err, res) => {
							if (err || res?.error) {
								reject(err || res?.error)
							}

							resolve(res?.result)
						},
					)*/
				})

				return response
			} catch (err) {
				return err
			}
		})

		communicator?.on(Methods.sendTransactions, (msg) => {
			// @ts-expect-error explore ways to fix this
			console.log("Add tx to queue");
			//openConfirmationModal(msg.data.params.txs as Transaction[], msg.data.params.params, msg.data.id)
		})

		communicator?.on(Methods.signMessage, async (msg) => {
			console.log("SIGN MESSAGE");
			//const { message } = msg.data.params as SignMessageParams

			//openSignMessageModal(message, msg.data.id)
		})
	}, [network, selectedAcc])

	const onUserTxConfirm = (safeTxHash, requestId) => {
		// Safe Apps SDK V1 Handler
		console.log("Send back tx confirmation to iframe")
		/*sendMessageToIframe(
			{ messageId: INTERFACE_MESSAGES.TRANSACTION_CONFIRMED, data: { safeTxHash } },
			confirmTransactionModal.requestId,
		)*/

		// Safe Apps SDK V2 Handler
		communicator?.send({ safeTxHash }, requestId)
	}

	const onTxReject = (requestId) => {
		// Safe Apps SDK V1 Handler
		console.log("Reject TX");
		/*sendMessageToIframe(
			{ messageId: INTERFACE_MESSAGES.TRANSACTION_REJECTED, data: {} },
			confirmTransactionModal.requestId,
		)*/

		// Safe Apps SDK V2 Handler
		communicator?.send('Transaction was rejected', requestId)
	}

    return (
    	<div>
			<iframe onLoad={function(){alert('onloaded');}} width="1280" ref={iframeRef} src={appUrl} />
			{selectedAcc}
			Gnosis SA
    	</div>)
}
