import { useEffect, useState } from 'react'
import {
	getSDKVersion,
	MessageFormatter,
	Methods
} from '@gnosis.pm/safe-apps-sdk'



function AppCommunicator(_iframeRef, _app){

	this.iframeRef = _iframeRef;
	this.app = _app;
	this.handlers = {};

	console.log("new appCommunicator");
	window.addEventListener('message', this.handleIncomingMessage)

	this.on = (method, handler) => {
		this.handlers[method] = handler;
	}


	this.isValidMessage = (msg) => {
		// @ts-expect-error .parent doesn't exist on some possible types
		const sentFromIframe = msg.source.parent === window.parent
		const knownMethod = Object.values(Methods).includes(msg.data.method)

		return sentFromIframe && knownMethod
	}

	this.canHandleMessage = (msg) => {
		return Boolean(this.handlers[msg.data.method])
	}

	this.send = (data, requestId, error ) => {
		const sdkVersion = getSDKVersion()
		const msg = error
			? MessageFormatter.makeErrorResponse(requestId, data, sdkVersion)
			: MessageFormatter.makeResponse(requestId, data, sdkVersion)

		this.iframeRef.current?.contentWindow?.postMessage(msg, '*')
	}

	this.handleIncomingMessage = async (msg) => {
		console.log("HandleIncomingMsg");
		console.log(msg);
		const validMessage = this.isValidMessage(msg)
		const hasHandler = this.canHandleMessage(msg)

		if (validMessage && hasHandler) {
			const handler = this.handlers[msg.data.method]
			try {
				// @ts-expect-error Handler existence is checked in this.canHandleMessage
				const response = await handler(msg)

				// If response is not returned, it means the response will be send somewhere else
				if (typeof response !== 'undefined') {
					this.send(response, msg.data.id)
				}
			} catch (err) {
				this.send(err.message, msg.data.id, true)
				/*trackError(Errors._901, err.message, {
					contexts: {
						safeApp: this.app,
						request: msg.data,
					},
				})*/
			}
		}
	}

	this.clear = () => {
		window.removeEventListener('message', this.handleIncomingMessage)
	}
}

const useAppCommunicator = (iframeRef, app) => {

	console.log("UseApp");
	console.log(iframeRef);
	console.log(app);

	/*const iframeRef = iframeRef
	const app = app*/
	const [communicator, setCommunicator] = useState(undefined);
	useEffect(() => {
		let communicatorInstance
		const initCommunicator = (iframeRef, app) => {
			communicatorInstance = new AppCommunicator(iframeRef, app)
			setCommunicator(communicatorInstance)
		}

		if (app) {
			initCommunicator(iframeRef, app)
		}

		return () => {
			communicatorInstance?.clear()
		}
	}, [app])

	return communicator
}

export { useAppCommunicator }
