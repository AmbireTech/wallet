import { getSDKVersion, MessageFormatter, Methods } from '@safe-global/safe-apps-sdk'

function GnosisConnector(_iframeRef, _app) {
  this.iframeRef = _iframeRef
  this.app = _app
  this.handlers = {}

  this.on = (method, handler) => {
    this.handlers[method] = handler
  }

  this.isValidMessage = (msg) => {
    // @ts-expect-error .parent doesn't exist on some possible types
    if (!msg?.source?.parent) {
      return false
    }
    const sentFromIframe = msg.source.parent === window.parent
    const knownMethod = Object.values(Methods).includes(msg.data.method)

    return sentFromIframe && knownMethod
  }

  this.canHandleMessage = (msg) => {
    return Boolean(this.handlers[msg.data.method])
  }

  this.send = (data, requestId, error) => {
    const sdkVersion = getSDKVersion()
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, error, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion)

    const withOrigin = { ...msg, origin: 'app.ambire.wallet' }

    if (this.iframeRef) {
      // console.log("Posting to child")
      // console.log(msg)
      this.iframeRef.current?.contentWindow?.postMessage(withOrigin, '*')
    } else {
      console.log('Iframe not referenced ')
    }
  }

  this.handleIncomingMessage = async (msg) => {
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
        console.error(`GS : ${err}`)
        this.send(null, msg.data.id, err.message)
        /* trackError(Errors._901, err.message, {
          contexts: {
            safeApp: this.app,
            request: msg.data,
          },
        }) */
      }
    }
  }

  this.clear = () => {
    // console.log('removeListener...')
    window.removeEventListener('message', this.handleIncomingMessage)
  }

  console.log('new appCommunicator')
  window.addEventListener('message', this.handleIncomingMessage)
}

export { GnosisConnector }
