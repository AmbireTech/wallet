const VERBOSE = typeof process.env.VERBOSE == 'undefined' ? 0 : (parseInt(process.env.VERBOSE) || 0)

//The name of the current process handling the msg (itself). can be pageContext (dapp page), iframe in dapp page, or ambirePageContext(ambire page). Sometimes "I, me" is mentioned, it refers to RELAYER (the relayer is talking)
let RELAYER

//callbacks for listeners from addMessageHandler
let HANDLERS = []

//iframe DOM ref
let IFRAME

//Generated iframe id
let FRAME_ID

//to be part of the JSON RPC generated ids
let MSGCOUNT = 0

//receiving localstorage channel to listen
let RECV_LOCALSTORAGE_CHANNEL

//localstorage channel to write
let POST_LOCALSTORAGE_CHANNEL

//when receiving msg for multiple recipients(kind of catchall), once handled by RELAYER, ignore it (in case of new msgs, if this one was not cleared from the queue yet)
let BROADCAST_MSG_TO_IGNORE = []

//same as above, avoid to reHandle same msg
let HANDLED_MSG_TO_IGNORE = []

//window listener handler
let WINDOWLISTENER

//FOR VERBOSITY
const RELAYER_VERBOSE_TAG = {
  'pageContext': '🖲️️',
  'iframe': '🧬',
  'ambirePageContext': '🔥️',
}

//clear specific msg from the receiving queue
const clearLocalStorageMessage = (message) => {
  try {
    let allMessages = JSON.parse(localStorage.getItem(RECV_LOCALSTORAGE_CHANNEL))
    allMessages = allMessages.filter(a => {
      return a.lsId !== message.lsId
    })

    //discardTimeout (discarding too old msgs stuck in localstorage)
    localStorage.setItem(RECV_LOCALSTORAGE_CHANNEL, JSON.stringify(allMessages))
  } catch (e) {
    console.error('error clearing localStorage', e)
  }
}

//add message to the local storage writing queue
const pushLocalStorageMessage = (message) => {
  try {
    message.lsId = `${RELAYER}_${new Date().getTime()}_${Math.random()}`
    let allMessages = JSON.parse(localStorage.getItem(POST_LOCALSTORAGE_CHANNEL))
    if (!allMessages || !allMessages.length) {
      allMessages = []
    }
    allMessages.push(message)
    localStorage.setItem(POST_LOCALSTORAGE_CHANNEL, JSON.stringify(allMessages))
  } catch (e) {
    console.error('error pushing localStorage', e)
  }
}


/**
 * first function to be called from "processes" using the messaging protocol
 * @param relayer == whoami
 * @param iframe reference (if relayer is iframe)
 */
export const setupAmbexBMLMessenger = (relayer, iframe) => {
  RELAYER = relayer
  IFRAME = iframe

  WINDOWLISTENER = (windowMessage) => {
    handleMessage(windowMessage.data)
  }

  //LocalStorage RECV handler
  const LS_MSG_HANDLER = event => {
    if (event.storageArea !== localStorage) return
    if (event.key === RECV_LOCALSTORAGE_CHANNEL) {
      let msgs
      try {
        msgs = JSON.parse(event.newValue)
      } catch (e) {
        console.error('Err parsing storage newValue', event.newValue)
        return
      }

      if (VERBOSE > 2) console.log('LS MSG', event)

      if (msgs && msgs.length) {
        for (let msg of msgs) {

          //skip is already handled by me
          if (HANDLED_MSG_TO_IGNORE.indexOf(msg.lsId) !== -1) {
            if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring already handled msg `, msg)
            continue
          }

          //skip AND remove from queue if too old
          if (!msg.discardTimeout || (msg.discardTimeout && msg.discardTimeout < new Date().getTime())) {
            if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] discarding old msg`, msg)
            clearLocalStorageMessage(msg)
            continue
          }

          //If I am the iframe
          if (RELAYER === 'iframe') {
            if (msg.toFrameId === FRAME_ID) {
              if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING targetted msg `, msg)
              //final destination, clearing msg from queue
              clearLocalStorageMessage(msg)
            } else if (msg.toFrameId === 'broadcast') {
              //skip this msg if already handled
              if (BROADCAST_MSG_TO_IGNORE.indexOf(msg.lsId) !== -1) {
                if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring broadcast msg `, msg)
                continue
              }

              //will handle the msg further but ignoring the same message to handle later
              BROADCAST_MSG_TO_IGNORE.push(msg.lsId)
              //clearing msg from queue after some time (to be sure every other process could read it)
              setTimeout(() => {
                const ignoreIndex = BROADCAST_MSG_TO_IGNORE.indexOf(msg.lsId)
                if (ignoreIndex !== -1) {
                  BROADCAST_MSG_TO_IGNORE.splice(ignoreIndex, 1)
                }
                clearLocalStorageMessage(msg)
              }, 1500)
            } else {
              //Message not for me, skip
              if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] skipping msg, not relevant Frame destination`, msg)
              continue
            }
          } else {
            //if I am ambireWalletPageContext, clear from queue before processing it
            clearLocalStorageMessage(msg)
          }

          //avoiding reHandling messages when n msgs concurrency happen
          HANDLED_MSG_TO_IGNORE.push(msg.lsId)
          //consider after some time we can remove it from the ids to ignore
          setTimeout(() => {
            const ignoreIndex = HANDLED_MSG_TO_IGNORE.indexOf(msg.lsId)
            if (ignoreIndex !== -1) {
              HANDLED_MSG_TO_IGNORE.splice(ignoreIndex, 1)
            }
          }, 1500)
          //handle msg by process
          handleMessage(msg)
        }
      }
    }
  }

  //if setup is for iframe, define localstorage channels
  if (RELAYER === 'iframe') {
    RECV_LOCALSTORAGE_CHANNEL = 'LS_WALLET2IFRAME'
    POST_LOCALSTORAGE_CHANNEL = 'LS_IFRAME2WALLET'
    FRAME_ID = 'frame_' + Math.random()
  } else if (RELAYER === 'ambirePageContext') {
    RECV_LOCALSTORAGE_CHANNEL = 'LS_IFRAME2WALLET'
    POST_LOCALSTORAGE_CHANNEL = 'LS_WALLET2IFRAME'
  }
  //no localstorage for pageContext(only postMessage communication)

  if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add EVENT LISTENER`)
  if (RELAYER === 'iframe') {
    //listen FROM WALLET
    window.addEventListener('storage', LS_MSG_HANDLER)
    //listen FROM DAPP
    window.addEventListener('message', WINDOWLISTENER)
  } else if (RELAYER === 'ambirePageContext') {
    //listen storage from iframe with
    window.addEventListener('storage', LS_MSG_HANDLER)
  } else {
    //listen postMessage from iframe
    window.addEventListener('message', WINDOWLISTENER)
  }
}

const handleMessage = function (message, sender = null) {
  if (!RELAYER) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger Could not handle message, RELAYER not set`, message)
  if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handling message`, message)

  //if I am the final message destination
  if (message.to === RELAYER) {

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
      if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handler #${handlerIndex} found`)
      HANDLERS[handlerIndex].callback(message, message.error)
    } else {
      if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] nothing to handle the message`, message)
    }
    //message not for me, but has destination
  } else if (message.to) {
    //init previous forwarders if not existing
    if (!message.forwarders) {
      message.forwarders = []
    }

    //If I already forwarded the message
    if (message.forwarders.indexOf(RELAYER) !== -1) {
      if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Already forwarded message. Ignoring`, message)
    } else if (message.from !== RELAYER) {
      if (VERBOSE > 0) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Forwarding message`, message)

      message.forwarders.push(RELAYER)
      sendMessageInternal(message).catch(err => {
        sendReply(message, { error: err.toString() })
      })
    } else {
      if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : Ignoring self message`, message)
    }
  } else {
    if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] : ambexBMLMessenger ignoring message`, message)
  }
}

//removing listeners and handlers, only for ambirePageContext / hooks reloading stuff
export const clear = function () {
  //ONLY FOR REACT AMBIRE WALLET
  if (RELAYER === 'ambirePageContext') {
    HANDLERS = []
    window.removeEventListener('message', WINDOWLISTENER)
    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add listeners cleared`)
  }
}

//updating and sending message
const sendMessageInternal = async (message) => {
  message.sender = RELAYER
  if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] try sendMessageInternal`, message)
  //If I am iframe
  if (RELAYER === 'iframe') {
    if (message.to === 'ambirePageContext') {
      //sending to wallet
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> WALLET:`)
      message.fromFrameId = FRAME_ID
      pushLocalStorageMessage(message)
    } else {
      //sending message to iframe parent
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> DAPP:`)
      window.parent.postMessage(message, '*')
    }
    //If I am wallet
  } else if (RELAYER === 'ambirePageContext') {
    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as WALLET -> IFRAME:`)
    //push message to writing queue
    pushLocalStorageMessage(message)
    //If I am dapp
  } else if (RELAYER === 'pageContext') {
    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as DAPP -> IFRAME:`)
    //send to child iframe
    IFRAME.contentWindow.postMessage(message, '*')
  }
}

//add handlers (can be filtered by type/dst/sender/reply)
export const addMessageHandler = (filter, callback) => {
  HANDLERS.push({
    requestFilter: { ...filter, isFilter: true },
    callback: callback
  })
  if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler added`, HANDLERS)
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

    //incrementing global var to compose msg id
    MSGCOUNT++
    message.id = `${RELAYER}_${MSGCOUNT}_${new Date().getTime()}_${Math.random()}`
    message.from = RELAYER

    //when can be the message clerared from queue
    message.discardTimeout = new Date().getTime() + options.replyTimeout

    const handlerFilter = {
      id: message.id,
      isReply: true
    }

    //handler when reply is requested and none is given
    const timeoutHandler = setTimeout(() => {
      removeMessageHandler({
        id: message.id,
        isReply: true
      })
      reject(new Error(`Timeout: no reply for message`))
      if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`)
    }, options.replyTimeout)

    if (callback) {
      //add a handler for the reply if there is a callback specified
      addMessageHandler({
        id: message.id,
        isReply: true
      }, (reply, error) => {
        if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Clearing Timeout`, message)
        clearTimeout(timeoutHandler)
        removeMessageHandler(handlerFilter)
        if (error) {
          return reject(error)
        }
        resolve(reply)
        callback(reply)
      })
    }

    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sendMessage`, message)

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
        }//else resolved in the handler above
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
  message.isReply = true
  message.toFrameId = fromMessage.fromFrameId
  //clear from queues if still there, after that time passed
  message.discardTimeout = new Date().getTime() + 1000

  sendMessageInternal(message).catch(err => {
    if (VERBOSE) console.error('sendReply failed', err)
  })
}

//sendReply shortcut, to be used by dApps
export const sendAck = (fromMessage) => {
  sendMessageInternal({
    from: RELAYER,
    to: fromMessage.from,
    isReply: true,
    id: fromMessage.id,
    data: { ack: true },
  }).catch(err => {
    if (VERBOSE) console.error('Send ack failed', err)
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
    if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler removed. ${HANDLERS.length} left`, filter)
  } else {
    if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler NOT FOUND. ${HANDLERS.length} left`, filter)
  }
}

//rpc error helper
export const makeRPCError = (requestPayload, error, errorCode = -1) => {
  return {
    id: requestPayload.id,
    version: requestPayload.version,
    error: { code: errorCode, message: error },
    jsonrpc: requestPayload.jsonrpc
  }
}
