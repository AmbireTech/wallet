import {useEffect, useCallback } from 'react'

const useIframeMessageHandler = (
	{iframeRef, address, ethBalance, safeName, appUrl, networkName}
) => {

	const sendMessageToIframe = useCallback((message, requestId) => {
		const requestWithMessage = {
			...message,
			requestId: requestId || Math.trunc(window.performance.now()),
			version: '0.4.2',
		};

		debugger;
		if (iframeRef) {
			iframeRef.current.contentWindow.postMessage(requestWithMessage, appUrl)
		}
	},
	[iframeRef],
	)

	useEffect(() => {
		const handleIframeMessage = (
			id,
			method,
			data
		) => {
			if (!method) {
				return
			}

			debugger;
			switch (method) {
				// typescript doesn't narrow type in switch/case statements
				// issue: https://github.com/microsoft/TypeScript/issues/20375
				// possible solution: https://stackoverflow.com/a/43879897/7820085
				case "SEND_TRANSACTIONS":
					if (data) {
						console.log("send to ambire tx queue");
						console.log(id);
						console.log(data);
					}
					break;

				case "getSafeInfo":
					const safeInfoMessage = {
						messageId: "ON_SAFE_INFO",
						data: {
							safeAddress: address,
							network: networkName,
							ethBalance: ethBalance,
						},
					}
					const envInfoMessage = {
						messageId: "ENV_INFO",
						data: {
							txServiceUrl: "http://todo",
						},
					}

					sendMessageToIframe(safeInfoMessage)
					sendMessageToIframe(envInfoMessage)
					break

				default:
					console.error(`ThirdPartyApp: A message was received with an unknown message id ${id}.`)
					break
			}
		}
		const onIframeMessage = async (event
		) => {
			if (event.origin === window.origin) {
				return
			}
			debugger;
			/*if (!selectedApp?.url.includes(event.origin)) {
				console.error(`ThirdPartyApp: A message was received from an unknown origin ${message.origin}`)
				return
			}*/
			handleIframeMessage(event.data.id, event.data.method, event.data.params)
		}

		window.addEventListener('message', onIframeMessage)
		return () => {
			window.removeEventListener('message', onIframeMessage)
		}
	}, [
		ethBalance,
		address,
		safeName,
		sendMessageToIframe,
	])

	return {
		sendMessageToIframe,
	}
}

export { useIframeMessageHandler }
