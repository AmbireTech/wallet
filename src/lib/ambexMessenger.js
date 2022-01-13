const PATH = ["pageContext", "contentScript", "background", "ambireContentScript", "ambirePageContext"];

const VERBOSE = parseInt(process.env.VERBOSE);

const AMBIRE_DOMAINS = process.env.AMBIRE_WALLET_URLS?process.env.AMBIRE_WALLET_URLS.split(" ").map(a => new URL(a).host):[];

let RELAYER;

let HANDLERS = [];
let AMBIRE_TABID;

let MSGCOUNT = 0;

let PERMISSION_MIDDLEWARE;

let WINDOWLISTENER;

const RELAYER_VERBOSE_TAG = {
	"pageContext" : "🖲️️",
	"contentScript" : "📺️",
	"background" : "🧬",
	"ambireContentScript" : "🎇",
	"ambirePageContext" : "🔥️",
}

// eslint-disable-next-line
//haxx eslint react ambire wallet
let chromeObject;
if (typeof chrome !== "undefined") {
	// eslint-disable-next-line
	chromeObject = chrome;
}

const setupAmbexMessenger = (relayer) => {
	RELAYER = relayer;

	WINDOWLISTENER = (windowMessage) => {
		handleMessage(windowMessage.data);
	};

	if (RELAYER === "background") {
		chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
			handleMessage(request, sender);
		});
	} else if (RELAYER === "contentScript" || RELAYER === "ambireContentScript") {
		chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
			handleMessage(request);
		});
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`);
		window.addEventListener("message", WINDOWLISTENER);
	} else if (RELAYER === "pageContext" || RELAYER === "ambirePageContext") {
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`);
		window.addEventListener("message", WINDOWLISTENER);
	}
};

const handleMessage = function (message, sender = null) {
	if (!RELAYER) debugger;
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handling message`, message);
	if (message.to === RELAYER) {//IF FINAL DESTINATION


		//SPECIAL CASE
		if (RELAYER === "background" && message.type === "setAmbireTabId") {
			AMBIRE_TABID = sender.tab.id;
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] AMBIRE TAB ID set to  ${sender.tab.id}`, message);
			return;
		}

		if (RELAYER === "background") {
			if (sender.tab) {
				message.fromTabId = sender.tab.id;
			} else if (sender.origin.startsWith("chrome-extension")) {
				message.fromTabId = "extension"
			}
		}

		if (message.data && message.data == "done") {
			debugger;
		}

		const handlerIndex = HANDLERS.findIndex(a => {
			let handle = true;
			if (
				//REPLIES
				a.requestFilter.isReply && (message.isReply && a.requestFilter.id !== message.id)
				//CALLS
				|| (
					a.requestFilter.type !== message.type
					|| a.requestFilter.from && a.requestFilter.from !== message.from
					|| a.requestFilter.to && a.requestFilter.to !== message.to
				)
			) handle = false;

			return handle;
		});

		if (handlerIndex !== -1) {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handler #${handlerIndex} found`);
			HANDLERS[handlerIndex].callback(message, message.error);
			if (message.isReply) {
				HANDLERS.splice(handlerIndex, 1);
			}
		} else {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] nothing to handle the message`, message);
		}
	} else if (message.to) {
		//ACT AS FORWARDER
		checkForwardPermission(message, sender, (granted) => {

			if (RELAYER === "background") {
				if (sender.tab) {
					message.fromTabId = sender.tab.id;
				} else if (sender.origin.startsWith("chrome-extension")) {
					message.fromTabId = "extension"
				}
			}

			if (granted) {
				if (!message.forwarders) {
					message.forwarders = [];
				}
				if (message.forwarders.indexOf(RELAYER) !== -1) {
					if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Already forwarded message. Ignoring`, message);
				} else if (message.from !== RELAYER) {
					if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Forwarding message`, message);
					/*if (RELAYER.endsWith("contentScript")) {
						message.fromTabId = PCTABID;
					}*/

					message.forwarders.push(RELAYER);
					try {
						sendMessageInternal(message);
					} catch (err) {
						sendReply(message, {error: err.toString()});
					}
				} else {
					if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Ignoring self message`, message);
				}
			} else {
				sendReply(message, {error: "permissions not granted"});
			}
		});
	} else {
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : ambexMessenger ignoring message`, message);
	}
};

//Handle permission popup + ambire origin security check
const checkForwardPermission = (message, sender, callback) => {
	const fromAmbire = ["ambireContentScript", "ambirePageContext"].indexOf(message.from) !== -1;

	if (RELAYER === "background") { // SHOULD BE SAME AS if RELAYER is background
		if (fromAmbire) {
			//VERIFY origin
			let url = sender.origin || sender.url;
			if (!sender.origin) {
				if (VERBOSE) console.warn("sender origin could not be found. Consider using chrome version 80+");
			}

			if (AMBIRE_DOMAINS.indexOf(new URL(url).host) !== -1) {
				callback(true);
			} else {
				if (VERBOSE) console.log(AMBIRE_DOMAINS);
				if (VERBOSE) console.warn(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : sending message to dApp not from trusted source`, url);
				callback(false);
			}
		} else if(message.from === "contentScript" && message.to === "contentScript") {//from extension to extension
			callback(true);
		} else { //FROM DAPP
			PERMISSION_MIDDLEWARE(message, sender, callback);
		}
	} else { // always relay otherwise
		callback(true);
	}
};

const setPermissionMiddleware = (callback) => {
	PERMISSION_MIDDLEWARE = callback;
};

const setAmbireTabId = () => {
	if (RELAYER === "ambireContentScript") {
		sendMessageInternal({
			to: "background",
			type: "setAmbireTabId"
		});
	} else {
		throw new Error("only possible from ambireContentScript");
	}
};

const clear = function () {
	//ONLY FOR REACT AMBIRE WALLET
	if (RELAYER === "ambirePageContext") {
		HANDLERS = [];
		window.removeEventListener("message", WINDOWLISTENER);
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add listeners cleared`);
	}
};

const sendMessageInternal = (message) => {
	message.sender = RELAYER;
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] try sendMessageInternal`, message);
	if (RELAYER === "background") {

		if (["ambireContentScript", "ambirePageContext"].indexOf(message.to) !== -1) {
			if (!AMBIRE_TABID) {
				throw new Error("Ambire TabID is not SET. is Ambire tab open?");
			}
			chromeObject.tabs.get(AMBIRE_TABID, tab => {
				if (!tab) {
					throw new Error("Ambire TabID could not be found. is Ambire tab open?");
				}
				//console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] toTabId must be specified for worker communication`, message);
				chromeObject.tabs.sendMessage(AMBIRE_TABID, message);
			});
			//check if exists
		} else if (!message.toTabId) {
			if (VERBOSE) console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] toTabId must be specified for worker communication`, message);
			return false;
		} else {
			// extension windows have no tabId
			if (message.toTabId === "extension") {
				chromeObject.runtime.sendMessage(message);
			} else {
				chromeObject.tabs.sendMessage(message.toTabId, message);
			}
		}
	} else if (RELAYER === "contentScript" || RELAYER === "ambireContentScript") {

		const path = RELAYER === "ambireContentScript"?[...PATH].reverse():PATH;
		const pathIndex = path.indexOf(RELAYER);
		const forwardPath = path.slice(pathIndex + 1, path.length);

		//console.log(forwardPath);
		//console.warn("path " + message.to, forwardPath);
		if (forwardPath.indexOf(message.to) !== -1) {//BG, ACS, APC
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> BG:`);
			chromeObject.runtime.sendMessage(message);
		} else if (message.to === "contentScript") {//other extension pages
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> CS:`);
			chromeObject.runtime.sendMessage(message);
		} else {
			if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message CS -> PC:`);
			window.postMessage(message);
		}
	} else if (RELAYER === "pageContext" || RELAYER === "ambirePageContext") {
		window.postMessage(message);
	}
};

//expecting to, type, optional DATA
const sendMessage = (message, callback, options = {}) => new Promise((res, rej) => {

		options = {
			replyTimeout: 5000,
			...options
		}

		MSGCOUNT++;
		const timeoutHandler = setTimeout(() => {
			removeMessageHandler({
				id: message.id,
				isReply: true
			})
			rej(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`);
			//rej(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Ambire wallet timeout`);
		}, options.replyTimeout);

		message.id = `${RELAYER}_${MSGCOUNT}_${Math.random()}`;
		message.from = RELAYER;
		//message.fromTabId = TABID;

		if (callback) {
			addMessageHandler({
				id: message.id,
				isReply: true
			}, (reply, error) => {
				if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] CLEARING TIMEOUT`, message);
				clearTimeout(timeoutHandler);
				if (error) {
					return rej(error);
				}
				res(reply);
				callback(reply);
			});
		}

		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sendMessage`, message);
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

const sendReply = (fromMessage, message) => {

	if (!fromMessage){
		debugger;
		return false;
	}

	message.id = fromMessage.id;
	message.from = RELAYER;
	message.to = fromMessage.from;
	message.toTabId = fromMessage.fromTabId;
	message.isReply = true;

	sendMessageInternal(message);
};

const sendAck = (fromMessage) => {
	sendMessageInternal({
		from : RELAYER,
		to : fromMessage.from,
		toTabId : fromMessage.fromTabId,
		isReply : true,
		id : fromMessage.id,
		data : {ack: true},
	});
};


const removeMessageHandler = (filter) => {
	const handlerIndex = HANDLERS.findIndex(a => {
		let handle = true;
		if (
			//REPLIES
			a.requestFilter.isReply && (filter.isReply && a.requestFilter.id !== filter.id)
			//CALLS
			|| (
				a.requestFilter.type !== filter.type
				|| a.requestFilter.from && a.requestFilter.from !== filter.from
				|| a.requestFilter.to && a.requestFilter.to !== filter.to
			)
		) handle = false;

		return handle;
	});

	if (handlerIndex !== -1) {
		HANDLERS.splice(handlerIndex, 1);
		if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler removed`, filter);
	}
}

const addMessageHandler = (filter, callback) => {
	HANDLERS.push({
		requestFilter: {...filter, isFilter: true},
		callback: callback
	});
	if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler added`, HANDLERS);
};

const makeRPCError = (requestPayload, error, errorCode=-1) => {
	return {
		id: requestPayload.id,
		version: requestPayload.version,
		error: {code:errorCode, message: error},
		jsonrpc: requestPayload.jsonrpc
	}
}

module.exports = {
	setupAmbexMessenger,
	sendMessage,
	sendReply,
	sendAck,
	addMessageHandler,
	setAmbireTabId,
	setPermissionMiddleware,
	clear,
	makeRPCError
};
