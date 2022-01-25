const VERBOSE = typeof process.env.VERBOSE == 'undefined' ? 0 : (parseInt(process.env.VERBOSE) || 0)

let RELAYER

let HANDLERS = []
let IFRAME
let FRAME_ID

let MSGCOUNT = 0

let RECV_LOCALSTORAGE_CHANNEL
let POST_LOCALSTORAGE_CHANNEL

let BROADCAST_MSG_TO_IGNORE = []
let HANDLED_MSG_TO_IGNORE = []

let WINDOWLISTENER

const RELAYER_VERBOSE_TAG = {
  'pageContext': '🖲️️',
  'iframe': '🧬',
  'ambirePageContext': '🔥️',
}

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

const pushLocalStorageMessage = (message) => {
  try {
    message.lsId = `${RELAYER}_${Math.random()}`
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

export const setupAmbexBMLMessenger = (relayer, iframe) => {
  RELAYER = relayer
  IFRAME = iframe

  WINDOWLISTENER = (windowMessage) => {
    handleMessage(windowMessage.data)
  }

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

          if (HANDLED_MSG_TO_IGNORE.indexOf(msg.id) !== -1) {
            if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring already handled msg `, msg)
            continue
          }

          if (!msg.discardTimeout || (msg.discardTimeout && msg.discardTimeout < new Date().getTime())) {
            if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] discarding old msg`, msg)
            clearLocalStorageMessage(msg)
            continue
          }

          if (RELAYER === 'iframe') {
            if (msg.toFrameId === FRAME_ID) {
              if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING targetted msg `, msg)
              clearLocalStorageMessage(msg)
            } else if (msg.toFrameId === 'broadcast') {
              if (BROADCAST_MSG_TO_IGNORE.indexOf(msg.id) !== -1) {
                if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Ignoring broadcast msg `, msg)
                continue
              }

              BROADCAST_MSG_TO_IGNORE.push(msg.id)
              setTimeout(() => {
                //if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING broadcast msg `, msg);
                const ignoreIndex = BROADCAST_MSG_TO_IGNORE.indexOf(msg.id)
                if (ignoreIndex !== -1) {
                  BROADCAST_MSG_TO_IGNORE.splice(ignoreIndex, 1)
                }

                clearLocalStorageMessage(msg)
              }, 1500)
            } else {
              if (VERBOSE > 1) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] skipping msg, not relevant Frame destination`, msg)
              continue
            }
          } else {
            clearLocalStorageMessage(msg)
          }
          //avoiding reHandling messages when n msgs concurrency happen
          HANDLED_MSG_TO_IGNORE.push(msg.id)
          setTimeout(() => {
            const ignoreIndex = HANDLED_MSG_TO_IGNORE.indexOf(msg.id)
            if (ignoreIndex !== -1) {
              HANDLED_MSG_TO_IGNORE.splice(ignoreIndex, 1)
            }
          }, 1500)
          handleMessage(msg)
        }
      }
    }
  }

  if (RELAYER === 'iframe') {
    RECV_LOCALSTORAGE_CHANNEL = 'LS_WALLET2IFRAME'
    POST_LOCALSTORAGE_CHANNEL = 'LS_IFRAME2WALLET'
    FRAME_ID = 'frame_' + Math.random()
  } else if (RELAYER === 'ambirePageContext') {
    RECV_LOCALSTORAGE_CHANNEL = 'LS_IFRAME2WALLET'
    POST_LOCALSTORAGE_CHANNEL = 'LS_WALLET2IFRAME'
  }

  if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add EVENT LISTENER`)
  if (RELAYER === 'iframe') {
    //FROM WALLET
    window.addEventListener('storage', LS_MSG_HANDLER)
    //FROM DAPP
    window.addEventListener('message', WINDOWLISTENER)
  } else if (RELAYER === 'ambirePageContext') {
    window.addEventListener('storage', LS_MSG_HANDLER)
  } else {
    window.addEventListener('message', WINDOWLISTENER)
  }
}

const handleMessage = function (message, sender = null) {
  if (!RELAYER) debugger;
  if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handling message`, message)
  if (message.to === RELAYER) {//IF FINAL DESTINATION

    if (message.data && message.data === 'done') {
      debugger;
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
      if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Handler #${handlerIndex} found`)
      HANDLERS[handlerIndex].callback(message, message.error)
    } else {
      if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] nothing to handle the message`, message)
    }
  } else if (message.to) {
    //ACT AS FORWARDER
    if (!message.forwarders) {
      message.forwarders = []
    }
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

export const clear = function () {
  //ONLY FOR REACT AMBIRE WALLET
  if (RELAYER === 'ambirePageContext') {
    HANDLERS = []
    window.removeEventListener('message', WINDOWLISTENER)
    if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] Add listeners cleared`)
  }
}

const sendMessageInternal = async (message) => {
  message.sender = RELAYER
  if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] try sendMessageInternal`, message)
  if (RELAYER === 'iframe') {
    if (message.to === 'ambirePageContext') {
      //to wallet
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> WALLET:`)
      //BROADCASTER.postMessage(message);
      message.fromFrameId = FRAME_ID
      pushLocalStorageMessage(message)
    } else {
      //to parent
      if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as IFRAME -> DAPP:`)
      window.parent.postMessage(message, '*')
    }
  } else if (RELAYER === 'ambirePageContext') {
    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as WALLET -> IFRAME:`)
    message.lsId = `${RELAYER}_${Math.random()}`
    //BROADCASTER.postMessage(message);
    pushLocalStorageMessage(message)
  } else if (RELAYER === 'pageContext') {
    if (VERBOSE) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] sending message as DAPP -> IFRAME:`)
    IFRAME.contentWindow.postMessage(message, '*')
  }
}

export const addMessageHandler = (filter, callback) => {
  HANDLERS.push({
    requestFilter: { ...filter, isFilter: true },
    callback: callback
  })
  if (VERBOSE > 2) console.debug(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] handler added`, HANDLERS)
}

//expecting to, type, optional DATA
export const sendMessage = (message, callback, options = {}) => new Promise((resolve, reject) => {

    options = {
      replyTimeout: 5000,
      ...options
    }

    MSGCOUNT++

    message.id = `${RELAYER}_${MSGCOUNT}_${new Date().getTime()}_${Math.random()}`
    message.from = RELAYER
    message.discardTimeout = new Date().getTime() + options.replyTimeout

    const handlerFilter = {
      id: message.id,
      isReply: true
    }

    const timeoutHandler = setTimeout(() => {
      removeMessageHandler({
        id: message.id,
        isReply: true
      })
      reject(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] timeout : ${JSON.stringify(message)}`)
    }, options.replyTimeout)

    if (callback) {
      addMessageHandler({
        id: message.id,
        isReply: true
      }, (reply, error) => {
        if (VERBOSE > 2) console.log(`${RELAYER_VERBOSE_TAG[RELAYER]} ambexBMLMessenger[${RELAYER}] CLEARING TIMEOUT`, message)
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
  message.isReply = true
  message.toFrameId = fromMessage.fromFrameId
  message.discardTimeout = new Date().getTime() + 1000

  sendMessageInternal(message).catch(err => {
    if (VERBOSE) console.error('sendReply failed', err)
  })
}

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


export const makeRPCError = (requestPayload, error, errorCode = -1) => {
  return {
    id: requestPayload.id,
    version: requestPayload.version,
    error: { code: errorCode, message: error },
    jsonrpc: requestPayload.jsonrpc
  }
}
