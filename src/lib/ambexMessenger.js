//this is the messaging lib, used by all the relayers*(see below). I decided to put whatever is related to messaging in one file for code useability and avoid duplicates / 5 files, using the same kind of pattern of sub process forks to determine who is currently the runner

//There are 5 possible actors for the communication, and a message has to follow this path (from one end to the other)
//Used to know for the current relayer to who to forward
const PATH = ['pageContext', 'contentScript', 'background', 'ambireContentScript', 'ambirePageContext']

const VERBOSE = parseInt(process.env.VERBOSE) || 4

//Explicitly tell the background worker which domains are ambire wallet domains when sending a message. In the forwarding middleware ( ambire -> dapp always OK, dapp -> ambire, only if permitted)
const AMBIRE_DOMAINS = process.env.AMBIRE_WALLET_URLS ? process.env.AMBIRE_WALLET_URLS.split(' ').map(a => new URL(a).host) : []

//The name of the current process handling the msg (itself). can be pageContext (dapp page), contentScript (dappPage with more permissions) background, ambireContentScript(ambire page with more permission) and ambirePageContext(ambire page). Sometimes "I, me" is mentioned, it refers to RELAYER (the relayer is talking)
let RELAYER

//callbacks for listeners from addMessageHandler
export let HANDLERS = []

//only for background worker, needs to know which tab is ambireWallet
let AMBIRE_TABID

//to be part of the JSON RPC generated ids when sendingMessage
let MSGCOUNT = 0

//Middleware func for background worker
let PERMISSION_MIDDLEWARE

//window listener handler
let WINDOWLISTENER

//for background only, messages coming in before background worker is fully initialized are stored in this queue to be processed after initialization
let INIT_MSG_QUEUE = []

//for background only, bool
let BACKGROUND_INITIALIZED

//for verbosity in the console
//Could create a log func to avoid repeating console logs with long concats
const RELAYER_VERBOSE_TAG = {
  'pageContext': '🖲️️',
  'contentScript': '📺️',
  'background': '🧬',
  'ambireContentScript': '🎇',
  'ambirePageContext': '🔥️',
}

// eslint-disable-next-line
//haxx eslint react ambire wallet
let chromeObject
if (typeof chrome !== 'undefined') {
  // eslint-disable-next-line
  chromeObject = chrome
}

/**
 * first function to be called from "processes" using the messaging protocol
 * @param relayer == whoami
 */
export const setupAmbexMessenger = (relayer) => {
  RELAYER = relayer

  WINDOWLISTENER = (windowMessage) => handleMessage(windowMessage.data)

  //If relayer is background
  if (RELAYER === 'background') {
    //listener for contentScript sent messages
    chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
      //if background worker not initialized, put received message in queue, unless it's a keepalive request reply from ambire wallet
      if (!BACKGROUND_INITIALIZED && !(request.isReply && request.to === 'background' && request.type === 'keepalive_reply')) {
        if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] request added to init queue`, request)
        INIT_MSG_QUEUE.push({
          request,
          sender
        })
      } else {
        //process incoming message
        handleMessage(request, sender)
      }
    })
    //Higher API levels scripts, injected in each end page
  } else if (RELAYER === 'contentScript' || RELAYER === 'ambireContentScript') {
    //listening to messages coming from background worker
    chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleMessage(request)
    })

    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`)
    //also listening to messages coming from it's own page (pageContext)
    window.addEventListener('message', WINDOWLISTENER)
  } else if (RELAYER === 'pageContext' || RELAYER === 'ambirePageContext') {
    //listening to messages coming from contentScripts
    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`)
    window.addEventListener('message', WINDOWLISTENER)
  }
}

const handleMessage = function (message, sender = null) {
  if (!RELAYER) debugger;
  if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handling message`, message)

  //if I am the final message destination
  if (message.to === RELAYER) {

    //SPECIAL CASE, msg sent from ambire wallet to inform about it's tabId to background when ambire contentScript is injected
    if (RELAYER === 'background' && message.type === 'setAmbireTabId') {
      AMBIRE_TABID = sender.tab.id
      if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] AMBIRE TAB ID set to  ${sender.tab.id}`, message)
      return
    }

    //setting tabId origin (normal pages or extension pages/popups)
    if (RELAYER === 'background') {
      if (sender.tab) {
        message.fromTabId = sender.tab.id
      } else if (sender.origin.startsWith('chrome-extension')) {
        message.fromTabId = 'extension'
      }
    }

    //get appropriate callback to handle message
    const handlerIndex = HANDLERS.findIndex(h =>
        //REPLIES
        (h.requestFilter.isReply && (message.isReply && h.requestFilter.id === message.id))
        //CALLS
        || (
          !h.requestFilter.isReply
          && h.requestFilter.type === message.type
          && (!h.requestFilter.from || h.requestFilter.from === message.from)
          && (!h.requestFilter.to || h.requestFilter.to === message.to)
        )
    )

    if (handlerIndex !== -1) {
      if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handler #${handlerIndex} found`)
      HANDLERS[handlerIndex].callback(message, message.error)
    } else {
      if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] nothing to handle the message`, message)
    }
  } else if (message.to) { //if message not for me, but has a destination, act as a forwarder

    //check if I have permission to forward @param message from this @param sender
    checkForwardPermission(message, sender, (granted) => {

      //Background is the gate letting pass messages or not
      if (RELAYER === 'background') {
        if (sender.tab) {
          message.fromTabId = sender.tab.id
        } else if (sender.origin.startsWith('chrome-extension')) {
          message.fromTabId = 'extension'
        }
      }

      //if permission granted
      if (granted) {
        //init previous forwarders if not existing (should I name it previousForwarders instead of forwarders?)
        if (!message.forwarders) {
          message.forwarders = []
        }

        //If I already forwarded the message
        if (message.forwarders.indexOf(RELAYER) !== -1) {
          if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Already forwarded message. Ignoring`, message)
        } else if (message.from !== RELAYER) { //If I did not forward this message and this message is NOT from me
          if (VERBOSE > 0) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Forwarding message`, message)
          message.forwarders.push(RELAYER)
          sendMessageInternal(message).catch(err => {
            sendReply(message, {error: err.message})
          })
        } else {
          if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Ignoring self message`, message)
        }
      } else {
        sendReply(message, {error: 'permissions not granted'})
      }
    })
  } else {
    if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : ambexMessenger ignoring message`, message)
  }
}

/**
 * Check if message has permission to pass through / display permission popup if not requested yet + ambire origin security check
 * @param message
 * @param sender
 * @param callback
 */
const checkForwardPermission = (message, sender, callback) => {
  //whether the message is sent from ambire
  const fromAmbire = ['ambireContentScript', 'ambirePageContext'].indexOf(message.from) !== -1

  //if I am background
  if (RELAYER === 'background') {
    if (fromAmbire) {
      //verify message origin (avoid spoofed messages to pass the security check)
      let url = sender.origin || sender.url
      if (!sender.origin) {
        if (VERBOSE) console.warn('sender origin could not be found. Consider using chrome version 80+')
      }

      //if sender is ambire whitelisted domains, always grant
      if (AMBIRE_DOMAINS.indexOf(new URL(url).host) !== -1) {
        callback(true)
      } else {//probably spoof
        if (VERBOSE) console.warn(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : sending message to dApp not from trusted source`, {
          url,
          AMBIRE_DOMAINS
        })
        callback(false)
      }
    } else if (message.from === 'contentScript' && message.to === 'contentScript') {//from/to contentScript/extension page, always forward
      callback(true)
    } else { // from dapp pageContext, go through the middleware that checks if domain is permitted
      PERMISSION_MIDDLEWARE(message, sender, callback)
    }
  } else { // if I am not background, always relay
    callback(true)
  }
}

// called in background worker
export const setPermissionMiddleware = (callback) => {
  PERMISSION_MIDDLEWARE = callback
}

//called by background
export const initAmbireTabId = (tabId) => {
  if (!AMBIRE_TABID) {
    if (VERBOSE > 1) console.log('ambire tab initiated to ' + tabId)
    AMBIRE_TABID = tabId * 1
  } else {
    if (VERBOSE > 1) console.log('ambire tab already set')
  }
}

//called by background processing the pending queue potentially filled before background worker initialisation, then clear it
export const processBackgroundQueue = () => {
  console.log('processing init pending messages queue', INIT_MSG_QUEUE)
  BACKGROUND_INITIALIZED = true
  for (let msg of INIT_MSG_QUEUE) {
    handleMessage(msg.request, msg.sender)
  }
  INIT_MSG_QUEUE = []
}

//called by ambireContentScript, to inform background about where the wallet page is
export const setAmbireTabId = () => {
  console.log('AMBEX MESSENGER.... SET AMBIRE TAB ID....')
  if (RELAYER === 'ambireContentScript') {
    sendMessageInternal({
      to: 'background',
      type: 'setAmbireTabId'
    })
  } else {
    throw new Error('only possible from ambireContentScript')
  }
}

//removing listeners and handlers, only for ambirePageContext / hooks reloading stuff
export const clear = function () {
  //ONLY FOR REACT AMBIRE WALLET
  if (RELAYER === 'ambirePageContext') {
    HANDLERS = []
    window.removeEventListener('message', WINDOWLISTENER)
    if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add listeners cleared`)
  }
}

//updating and sending message, not exposed
const sendMessageInternal = async (message) => {
  message.sender = RELAYER
  if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] try sendMessageInternal`, message)
  //If I am background worker
  if (RELAYER === 'background') {

    //If destination is for wallet
    if (['ambireContentScript', 'ambirePageContext'].indexOf(message.to) !== -1) {

      let ambireTabId = AMBIRE_TABID
      //if ambireTabId does not exist yet, and the message comes fronm background with a specified toTabId, we override it
      if (!ambireTabId && message.from === 'background' && message.toTabId) {
        ambireTabId = message.toTabId * 1//I don't remember exactly why but int required by chrome api, however toTabId is a str(I think because it's the key of AMBIRE_TAB_INJECTIONS in background so has to be converted at some point
      }

      //if null or NaN
      if (!ambireTabId) {
        throw new Error(`Ambire TabID is not SET. Is Ambire wallet open?`)
      }

      //send message to ambire pageContext tab, if found
      const sent = await new Promise((resolve, reject) => {
        chromeObject.tabs.get(ambireTabId, tab => {
          if (tab) {
            chromeObject.tabs.sendMessage(ambireTabId, message)
            resolve(true)
          } else {
            resolve(false)
          }
        })
      })

      if (!sent) {
        throw new Error(`Could not find ambire wallet on tab ${ambireTabId}. Is Ambire wallet open?`)
      }

    } else if (!message.toTabId) {// if no toTabId specified, background does not know where to sent it
      if (VERBOSE) console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] toTabId must be specified for worker communication`, message)
      return false
    } else {
      // extension pages have no tabId but 'extension' is specified in the msg
      if (message.toTabId === 'extension') {
        chromeObject.runtime.sendMessage(message)
      } else {// for specific contentScript tabs
        chromeObject.tabs.sendMessage(message.toTabId, message)
      }
    }
  } else if (RELAYER === 'contentScript' || RELAYER === 'ambireContentScript') {

    //check in which direction to sent
    const path = RELAYER === 'ambireContentScript' ? [...PATH].reverse() : PATH
    const pathIndex = path.indexOf(RELAYER)
    const forwardPath = path.slice(pathIndex + 1, path.length)

    if (forwardPath.indexOf(message.to) !== -1) {//if next relayers are BG, ACS, APC
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> BG:`)
      chromeObject.runtime.sendMessage(message)
    } else if (message.to === 'contentScript') {//other extension pages
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> CS:`)
      chromeObject.runtime.sendMessage(message)
    } else {//passing down to pageContext
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message CS -> PC:`)
      window.postMessage(message)
    }
  } else if (RELAYER === 'pageContext' || RELAYER === 'ambirePageContext') {
    //passing up to contentScripts
    window.postMessage(message)
  }
}

/**
 * used by processes to send messages
 * @param message == {to, type, [data]}
 * @param callback optional reply callback
 * @param options for now only replyTimeout
 */
export const sendMessage = (message, callback, options = {}) => new Promise((resolve, reject) => {

    options = {
      replyTimeout: 5000,
      ...options
    }

    //incrementing global var of sender to compose msg id
    MSGCOUNT++

    message.id = `${RELAYER}_${MSGCOUNT}_${Math.random()}`
    message.from = RELAYER

    const handlerFilter = {
      id: message.id,
      isReply: true
    }

    //handler when reply is requested and none is given
    const timeoutHandler = setTimeout(() => {
      removeMessageHandler(handlerFilter)
      reject(new Error(`Timeout: no reply for message`))
      if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`)
    }, options.replyTimeout)

    if (callback) {
      //add a handler for the reply if there is a callback specified
      addMessageHandler({
        id: message.id,
        isReply: true
      }, (reply, error) => {
        if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] clearing timeout listener`, message)
        clearTimeout(timeoutHandler)
        removeMessageHandler(handlerFilter)
        if (error) {
          return reject(error)
        }
        resolve(reply)
        callback(reply)
      })
    }

    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sendMessage ${callback ? '' : '[no reply requested]'}`, message)

    sendMessageInternal(message)
      .catch(err => {
        console.log('sendMsgInternal err', err)
        clearTimeout(timeoutHandler)
        removeMessageHandler(handlerFilter)
        reject(err.message)
      })
      .then(res => {
        if (!callback) {
          resolve(null)
        }//else : resolved in the handler above
      })
  }
)

/**
 * reply to request, meant to be used by sendMessage processes callbacks
 * @param fromMessage the original request message
 * @param message message to reply with (in most of the cases only data should be passed {[data]}). from / to will be specified here
 */
export const sendReply = (fromMessage, message) => {
  if (!fromMessage) {
    return false
  }

  message.id = fromMessage.id
  message.from = RELAYER
  message.to = fromMessage.from
  message.toTabId = fromMessage.fromTabId
  message.isReply = true
  //for debug/verbose purposes
  message.originalMessage = fromMessage

  sendMessageInternal(message).catch(err => {
    if (VERBOSE) console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sendReply failed`, err)
  })
}

//sendReply shortcut, to be used by dApps
export const sendAck = (fromMessage) => {
  sendMessageInternal({
    from: RELAYER,
    to: fromMessage.from,
    toTabId: fromMessage.fromTabId,
    isReply: true,
    id: fromMessage.id,
    data: {ack: true},
  }).catch(err => {
    if (VERBOSE) console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sendAck failed`, err)
  })
}

export const removeMessageHandler = (filter) => {
  const handlerIndex = HANDLERS.findIndex(h =>
    //REPLIES
    (h.requestFilter.isReply && (filter.isReply && h.requestFilter.id === filter.id))
    //CALLS
    || (
      !h.requestFilter.isReply
      && h.requestFilter.type === filter.type
      && (!h.requestFilter.from || h.requestFilter.from === filter.from)
      && (!h.requestFilter.to || h.requestFilter.to === filter.to)
    ))

  if (handlerIndex !== -1) {
    HANDLERS.splice(handlerIndex, 1)
    if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler removed. ${HANDLERS.length} left`, filter)
  } else {
    if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler NOT FOUND. ${HANDLERS.length} left`, filter)
  }
}

//add handlers (can be filtered by type/dst/sender/reply)
export const addMessageHandler = (filter, callback) => {
  HANDLERS.push({
    requestFilter: {...filter, isFilter: true},
    callback: callback
  })
  if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler added`, HANDLERS)
}

//rpc error helper
export const makeRPCError = (requestPayload, error, errorCode = -1) => {
  return {
    id: requestPayload.id,
    version: requestPayload.version,
    error: {code: errorCode, message: error},
    jsonrpc: requestPayload.jsonrpc
  }
}

