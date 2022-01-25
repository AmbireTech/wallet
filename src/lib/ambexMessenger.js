const PATH = ['pageContext', 'contentScript', 'background', 'ambireContentScript', 'ambirePageContext']

const VERBOSE = parseInt(process.env.VERBOSE) || 0
console.error('verbose', VERBOSE)

const AMBIRE_DOMAINS = process.env.AMBIRE_WALLET_URLS ? process.env.AMBIRE_WALLET_URLS.split(' ').map(a => new URL(a).host) : []

let RELAYER

let HANDLERS = []
let AMBIRE_TABID

let MSGCOUNT = 0

let PERMISSION_MIDDLEWARE

let WINDOWLISTENER

//background init delay MSG queue
let INIT_MSG_QUEUE = []
let BACKGROUND_INITIALIZED

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

export const setupAmbexMessenger = (relayer) => {
  RELAYER = relayer

  WINDOWLISTENER = (windowMessage) => {
    handleMessage(windowMessage.data)
  }

  if (RELAYER === 'background') {
    chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
      //if NOT loaded, put in queue
      if (!BACKGROUND_INITIALIZED && !(request.isReply && request.to === 'background' && request.type === 'keepalive_reply')) {
        if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] request added to init queue`, request)
        INIT_MSG_QUEUE.push({
          request,
          sender
        })
      } else {
        handleMessage(request, sender)
      }
    })
  } else if (RELAYER === 'contentScript' || RELAYER === 'ambireContentScript') {
    chromeObject.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleMessage(request)
    })
    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`)
    window.addEventListener('message', WINDOWLISTENER)
  } else if (RELAYER === 'pageContext' || RELAYER === 'ambirePageContext') {
    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add EVENT LISTENER`)
    window.addEventListener('message', WINDOWLISTENER)
  }
}

const handleMessage = function (message, sender = null) {
  if (!RELAYER) debugger;
  if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handling message`, message)
  if (message.to === RELAYER) {//IF FINAL DESTINATION

    //SPECIAL CASE
    if (RELAYER === 'background' && message.type === 'setAmbireTabId') {
      AMBIRE_TABID = sender.tab.id
      if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] AMBIRE TAB ID set to  ${sender.tab.id}`, message)
      return
    }

    if (RELAYER === 'background') {
      if (sender.tab) {
        message.fromTabId = sender.tab.id
      } else if (sender.origin.startsWith('chrome-extension')) {
        message.fromTabId = 'extension'
      }
    }

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
      /*if (message.isReply) {
        if (VERBOSE) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Handler removed`)
        HANDLERS.splice(handlerIndex, 1)
      }*/
    } else {
      if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] nothing to handle the message`, message)
    }
  } else if (message.to) {
    //ACT AS FORWARDER
    checkForwardPermission(message, sender, (granted) => {

      if (RELAYER === 'background') {
        if (sender.tab) {
          message.fromTabId = sender.tab.id
        } else if (sender.origin.startsWith('chrome-extension')) {
          message.fromTabId = 'extension'
        }
      }

      if (granted) {
        if (!message.forwarders) {
          message.forwarders = []
        }
        if (message.forwarders.indexOf(RELAYER) !== -1) {
          if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Already forwarded message. Ignoring`, message)
        } else if (message.from !== RELAYER) {
          if (VERBOSE > 0) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : Forwarding message`, message)
          /*if (RELAYER.endsWith("contentScript")) {
            message.fromTabId = PCTABID;
          }*/

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

//Handle permission popup + ambire origin security check
const checkForwardPermission = (message, sender, callback) => {
  const fromAmbire = ['ambireContentScript', 'ambirePageContext'].indexOf(message.from) !== -1

  if (RELAYER === 'background') { // SHOULD BE SAME AS if RELAYER is background
    if (fromAmbire) {
      //VERIFY origin
      let url = sender.origin || sender.url
      if (!sender.origin) {
        if (VERBOSE) console.warn('sender origin could not be found. Consider using chrome version 80+')
      }

      if (AMBIRE_DOMAINS.indexOf(new URL(url).host) !== -1) {
        callback(true)
      } else {
        if (VERBOSE) console.warn(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] : sending message to dApp not from trusted source`, {url, AMBIRE_DOMAINS})
        callback(false)
      }
    } else if (message.from === 'contentScript' && message.to === 'contentScript') {//from extension to extension
      callback(true)
    } else { //FROM DAPP
      PERMISSION_MIDDLEWARE(message, sender, callback)
    }
  } else { // always relay otherwise
    callback(true)
  }
}

export const setPermissionMiddleware = (callback) => {
  PERMISSION_MIDDLEWARE = callback
}

export const initAmbireTabId = (tabId) => {
  if (!AMBIRE_TABID) {
    if (VERBOSE > 1) console.log('ambire tab initiated to ' + tabId)
    AMBIRE_TABID = tabId * 1
  } else {
    if (VERBOSE > 1) console.log('ambire tab already set')
  }
}

export const processBackgroundQueue = () => {
  console.log('processing init pending messages queue', INIT_MSG_QUEUE)
  BACKGROUND_INITIALIZED = true
  for (let msg of INIT_MSG_QUEUE) {
    handleMessage(msg.request, msg.sender)
  }
  INIT_MSG_QUEUE = []
}

export const setAmbireTabId = () => {
  if (RELAYER === 'ambireContentScript') {
    sendMessageInternal({
      to: 'background',
      type: 'setAmbireTabId'
    })
  } else {
    throw new Error('only possible from ambireContentScript')
  }
}

export const clear = function () {
  //ONLY FOR REACT AMBIRE WALLET
  if (RELAYER === 'ambirePageContext') {
    HANDLERS = []
    window.removeEventListener('message', WINDOWLISTENER)
    if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Add listeners cleared`)
  }
}

const sendMessageInternal = async (message) => {
  message.sender = RELAYER
  if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] try sendMessageInternal`, message)
  if (RELAYER === 'background') {

    if (['ambireContentScript', 'ambirePageContext'].indexOf(message.to) !== -1) {
      let ambireTabId = AMBIRE_TABID
      if (!ambireTabId && message.from === 'background' && message.toTabId) {
        ambireTabId = message.toTabId * 1
      }
      if (!ambireTabId) {
        throw new Error(`Ambire TabID is not SET. Is Ambire wallet open?`)
      }

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

      //check if exists
    } else if (!message.toTabId) {
      if (VERBOSE) console.error(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] toTabId must be specified for worker communication`, message)
      return false
    } else {
      // extension windows have no tabId
      if (message.toTabId === 'extension') {
        chromeObject.runtime.sendMessage(message)
      } else {
        chromeObject.tabs.sendMessage(message.toTabId, message)
      }
    }
  } else if (RELAYER === 'contentScript' || RELAYER === 'ambireContentScript') {

    const path = RELAYER === 'ambireContentScript' ? [...PATH].reverse() : PATH
    const pathIndex = path.indexOf(RELAYER)
    const forwardPath = path.slice(pathIndex + 1, path.length)

    //console.log(forwardPath);
    //console.warn("path " + message.to, forwardPath);
    if (forwardPath.indexOf(message.to) !== -1) {//BG, ACS, APC
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> BG:`)
      chromeObject.runtime.sendMessage(message)
    } else if (message.to === 'contentScript') {//other extension pages
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message as CS -> CS:`)
      chromeObject.runtime.sendMessage(message)
    } else {
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] sending message CS -> PC:`)
      window.postMessage(message)
    }
  } else if (RELAYER === 'pageContext' || RELAYER === 'ambirePageContext') {
    window.postMessage(message)
  }
}

//expecting to, type, optional DATA
export const sendMessage = (message, callback, options = {}) => new Promise((resolve, reject) => {

    options = {
      replyTimeout: 5000,
      ...options
    }

    MSGCOUNT++

    message.id = `${RELAYER}_${MSGCOUNT}_${Math.random()}`
    message.from = RELAYER

    const handlerFilter = {
      id: message.id,
      isReply: true
    }

    const timeoutHandler = setTimeout(() => {
      removeMessageHandler(handlerFilter)
      reject(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`)
      //rej(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] Ambire wallet timeout`);
    }, options.replyTimeout)

    //message.fromTabId = TABID;

    if (callback) {
      addMessageHandler({
        id: message.id,
        isReply: true
      }, (reply, error) => {
        //if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] clearing timeout listener`, message)
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

    sendMessageInternal(message).catch(err => {
      console.log('sendMsgInternal err', err)
      //if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] clearing timeout listener`, message)
      clearTimeout(timeoutHandler)
      removeMessageHandler(handlerFilter)
      reject(err.message)
    }).then(res => {
      if (!callback) {
        resolve(null)
      }
    })
  }
)

export const sendReply = (fromMessage, message) => {

  if (!fromMessage) {
    debugger;
    return false
  }

  message.id = fromMessage.id
  message.from = RELAYER
  message.to = fromMessage.from
  message.toTabId = fromMessage.fromTabId
  message.isReply = true
  message.originalMessage = fromMessage

  sendMessageInternal(message).catch(err => {
    if (VERBOSE) console.error('sendReply failed', err)
  })
}

export const sendAck = (fromMessage) => {
  sendMessageInternal({
    from: RELAYER,
    to: fromMessage.from,
    toTabId: fromMessage.fromTabId,
    isReply: true,
    id: fromMessage.id,
    data: {ack: true},
  }).catch(err => {
    if (VERBOSE) console.error('Send ack failed', err)
  })
}

const removeMessageHandler = (filter) => {
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

export const addMessageHandler = (filter, callback) => {
  HANDLERS.push({
    requestFilter: {...filter, isFilter: true},
    callback: callback
  })
  if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexMessenger[${RELAYER}] handler added`, HANDLERS)
}

export const makeRPCError = (requestPayload, error, errorCode = -1) => {
  return {
    id: requestPayload.id,
    version: requestPayload.version,
    error: {code: errorCode, message: error},
    jsonrpc: requestPayload.jsonrpc
  }
}
