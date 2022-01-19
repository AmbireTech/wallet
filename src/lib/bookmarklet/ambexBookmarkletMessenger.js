const VERBOSE = typeof process.env.VERBOSE == "undefined" ? 1 : parseInt(process.env.VERBOSE);

let RELAYER;

let HANDLERS = [];
let IFRAME;
let FRAME_ID;

let MSGCOUNT = 0;

//let BROADCASTER;
let RECV_LOCALSTORAGE_CHANNEL;
let POST_LOCALSTORAGE_CHANNEL;

let BROADCAST_MSG_TO_IGNORE = [];
let HANDLED_MSG_TO_IGNORE = [];

let WINDOWLISTENER;

const RELAYER_VERBOSE_TAG = {
	"pageContext": "🖲️️",
	"iframe": "🧬",
	"ambirePageContext": "🔥️",
};

// eslint-disable-next-line
//haxx eslint react ambire wallet

const clearLocalStorageMessage = (message) => {
	try {
		let allMessages = JSON.parse(localStorage.getItem(RECV_LOCALSTORAGE_CHANNEL));
		allMessages = allMessages.filter(a => {
			return a.lsId !== message.lsId;
		});

		/*const filteredMsgCount = allMessages.length;
		allMessages = allMessages.filter(a => {
			return (a.discardTimeout && a.discardTimeout < new Date().getTime());
		});*/

		/*if(allMessages.length < filteredMsgCount){
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Discarded msgs`, allMessages.length - filteredMsgCount);
		}*/
		//discardTimeout
		localStorage.setItem(RECV_LOCALSTORAGE_CHANNEL, JSON.stringify(allMessages));
	} catch (e) {
		console.error("error clearing localStorage", e);
	}
};

const pushLocalStorageMessage = (message) => {
	try {
		message.lsId = `${RELAYER}_${Math.random()}`;
		let allMessages = JSON.parse(localStorage.getItem(POST_LOCALSTORAGE_CHANNEL));
		if (!allMessages || !allMessages.length) {
			allMessages = [];
		}
		allMessages.push(message);
		localStorage.setItem(POST_LOCALSTORAGE_CHANNEL, JSON.stringify(allMessages));
	} catch (e) {
		console.error("error pushing localStorage", e);
	}
};

/*const getLocalStorageMessages = () => {
	try {
		let allMessages = JSON.parse(localStorage.getItem(RECV_LOCALSTORAGE_CHANNEL));
		return allMessages || [];
	} catch (e) {
		console.error("error getting localStorage", e);
	}
};*/

export const setupAmbexBMLMessenger = (relayer, iframe) => {
	RELAYER = relayer;
	IFRAME = iframe;

	WINDOWLISTENER = (windowMessage) => {
		handleMessage(windowMessage.data);
	};

	const LS_MSG_HANDLER = event => {
		if (event.storageArea !== localStorage) return;
		if (event.key === RECV_LOCALSTORAGE_CHANNEL) {
			//const msgs = getLocalStorageMessages();
			let msgs;
			try{
				msgs = JSON.parse(event.newValue);
			} catch (e) {
				console.error("Err parsing storage newValue", event.newValue);
				return;
			}

			console.log("LS MSG", event);
			//console.log("msgs", msgs);
			if (msgs && msgs.length) {
				for (let msg of msgs) {

					if (HANDLED_MSG_TO_IGNORE.indexOf(msg.id) !== -1) {
						if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring already handled msg `, msg);
						continue;
					}

					if (!msg.discardTimeout || (msg.discardTimeout && msg.discardTimeout < new Date().getTime())) {
						if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] discarding old msg`, msg);
						clearLocalStorageMessage(msg);
						continue;
					}

					if (RELAYER === "iframe") {
						if (msg.toFrameId === FRAME_ID) {
							if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING targetted msg `, msg);
							clearLocalStorageMessage(msg);
						} else if (msg.toFrameId === "broadcast") {
							if (BROADCAST_MSG_TO_IGNORE.indexOf(msg.id) !== -1) {
								if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring broadcast msg `, msg);
								continue;
							}

							BROADCAST_MSG_TO_IGNORE.push(msg.id);
							setTimeout(() => {
								//if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING broadcast msg `, msg);
								const ignoreIndex = BROADCAST_MSG_TO_IGNORE.indexOf(msg.id);
								if (ignoreIndex !== -1) {
									BROADCAST_MSG_TO_IGNORE.splice(ignoreIndex, 1);
								}

								clearLocalStorageMessage(msg);
							}, 1500);
						} else {
							if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] skipping msg, not relevant Frame destination`, msg);
							continue;
						}
					} else {
						clearLocalStorageMessage(msg);
					}
					//avoiding reHandling messages when n msgs concurrency happen
					HANDLED_MSG_TO_IGNORE.push(msg.id);
					setTimeout(() => {
						const ignoreIndex = HANDLED_MSG_TO_IGNORE.indexOf(msg.id);
						if (ignoreIndex !== -1) {
							HANDLED_MSG_TO_IGNORE.splice(ignoreIndex, 1);
						}
					}, 1500);
					handleMessage(msg);
				}
			}
		}
	};

	if (RELAYER === "iframe") {
		RECV_LOCALSTORAGE_CHANNEL = "LS_WALLET2IFRAME";
		POST_LOCALSTORAGE_CHANNEL = "LS_IFRAME2WALLET";
		FRAME_ID = "frame_" + Math.random();
	} else if (RELAYER === "ambirePageContext") {
		RECV_LOCALSTORAGE_CHANNEL = "LS_IFRAME2WALLET";
		POST_LOCALSTORAGE_CHANNEL = "LS_WALLET2IFRAME";
	}

	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add EVENT LISTENER`);
	if (RELAYER === "iframe") {
		//FROM WALLET
		window.addEventListener('storage', LS_MSG_HANDLER);
		/*BROADCASTER = new BroadcastChannel('ambireBroadcastChannel');
		BROADCASTER.onmessage = (event) => {
			console.error("ambire broadcast event", event);
			handleMessage(event.data);
		};*/

		//FROM DAPP
		window.addEventListener("message", WINDOWLISTENER);
	} else if (RELAYER === "ambirePageContext") {
		window.addEventListener('storage', LS_MSG_HANDLER);
		/*BROADCASTER = new BroadcastChannel('ambireBroadcastChannel');
		BROADCASTER.onmessage = (event) => {
			console.error("ambire broadcast event", event);
			handleMessage(event.data);
		};*/
	} else {
		window.addEventListener("message", WINDOWLISTENER);
	}
};

const handleMessage = function (message, sender = null) {
	if (!RELAYER) debugger;
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handling message`, message);
	if (message.to === RELAYER) {//IF FINAL DESTINATION

		if (message.data && message.data === "done") {
			debugger;
		}

		const handlerIndex = HANDLERS.findIndex(a => {
			let handle = true;
			if (
				//REPLIES
				(a.requestFilter.isReply && (message.isReply && a.requestFilter.id !== message.id))
				//CALLS
				|| (
					a.requestFilter.type !== message.type
					|| (a.requestFilter.from && a.requestFilter.from !== message.from)
					|| (a.requestFilter.to && a.requestFilter.to !== message.to)
				)
			) handle = false;

			return handle;
		});

		if (handlerIndex !== -1) {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handler #${handlerIndex} found`);
			HANDLERS[handlerIndex].callback(message, message.error);
			if (message.isReply) {
				HANDLERS.splice(handlerIndex, 1);
			}
		} else {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] nothing to handle the message`, message);
		}
	} else if (message.to) {
		//ACT AS FORWARDER
		if (!message.forwarders) {
			message.forwarders = [];
		}
		if (message.forwarders.indexOf(RELAYER) !== -1) {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Already forwarded message. Ignoring`, message);
		} else if (message.from !== RELAYER) {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Forwarding message`, message);

			message.forwarders.push(RELAYER);
			try {
				sendMessageInternal(message);
			} catch (err) {
				sendReply(message, {error: err.toString()});
			}
		} else {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Ignoring self message`, message);
		}
	} else {
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : ambexBMLMessenger ignoring message`, message);
	}
};

export const clear = function () {
	//ONLY FOR REACT AMBIRE WALLET
	if (RELAYER === "ambirePageContext") {
		HANDLERS = [];
		window.removeEventListener("message", WINDOWLISTENER);
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add listeners cleared`);
	}
};

const sendMessageInternal = (message) => {
	message.sender = RELAYER;
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] try sendMessageInternal`, message);
	if (RELAYER === "iframe") {
		if (message.to === "ambirePageContext") {
			//to wallet
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> WALLET:`);
			//BROADCASTER.postMessage(message);
			message.fromFrameId = FRAME_ID;
			pushLocalStorageMessage(message);
		} else {
			//to parent
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> DAPP:`);
			window.parent.postMessage(message, "*");
		}
	} else if (RELAYER === "ambirePageContext") {
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as WALLET -> IFRAME:`);
		message.lsId = `${RELAYER}_${Math.random()}`;
		//BROADCASTER.postMessage(message);
		pushLocalStorageMessage(message);
	} else if (RELAYER === "pageContext") {
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as DAPP -> IFRAME:`);
		IFRAME.contentWindow.postMessage(message, "*");
	}
};

export const addMessageHandler = (filter, callback) => {
	HANDLERS.push({
		requestFilter: {...filter, isFilter: true},
		callback: callback
	});
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler added`, HANDLERS);
};

//expecting to, type, optional DATA
export const sendMessage = (message, callback, options = {}) => new Promise((res, rej) => {

		options = {
			replyTimeout: 5000,
			...options
		};

		MSGCOUNT++;
		const timeoutHandler = setTimeout(() => {
			removeMessageHandler({
				id: message.id,
				isReply: true
			});
			rej(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`);
			//rej(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ambire wallet timeout`);
		}, options.replyTimeout);

		message.id = `${RELAYER}_${MSGCOUNT}_${new Date().getTime()}_${Math.random()}`;
		message.from = RELAYER;
		message.discardTimeout = new Date().getTime() + options.replyTimeout
		//message.fromTabId = TABID;

		if (callback) {
			addMessageHandler({
				id: message.id,
				isReply: true
			}, (reply, error) => {
				if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING TIMEOUT`, message);
				clearTimeout(timeoutHandler);
				if (error) {
					return rej(error);
				}
				res(reply);
				callback(reply);
			});
		}

		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sendMessage`, message);
		try {
			sendMessageInternal(message);
		} catch (err) {
			clearTimeout(timeoutHandler);
			return rej(err.toString());
		}

		if (!callback) {
			res(null);
		}
	}
);

export const sendReply = (fromMessage, message) => {
	if (!fromMessage) {
		debugger;
		return false;
	}

	message.id = fromMessage.id;
	message.from = RELAYER;
	message.to = fromMessage.from;
	message.isReply = true;
	message.toFrameId = fromMessage.fromFrameId;
	message.discardTimeout = new Date().getTime() + 1000;

	sendMessageInternal(message);
};

export const sendAck = (fromMessage) => {
	sendMessageInternal({
		from: RELAYER,
		to: fromMessage.from,
		isReply: true,
		id: fromMessage.id,
		data: {ack: true},
	});
};


export const removeMessageHandler = (filter) => {
	const handlerIndex = HANDLERS.findIndex(a => {
		let handle = true;
		if (
			//REPLIES
			(a.requestFilter.isReply && (filter.isReply && a.requestFilter.id !== filter.id))
			//CALLS
			|| (
				a.requestFilter.type !== filter.type
				|| (a.requestFilter.from && a.requestFilter.from !== filter.from)
				|| (a.requestFilter.to && a.requestFilter.to !== filter.to)
			)
		) handle = false;

		return handle;
	});

	if (handlerIndex !== -1) {
		HANDLERS.splice(handlerIndex, 1);
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler removed`, filter);
	}
};


export const makeRPCError = (requestPayload, error, errorCode = -1) => {
	return {
		id: requestPayload.id,
		version: requestPayload.version,
		error: {code: errorCode, message: error},
		jsonrpc: requestPayload.jsonrpc
	};
};
