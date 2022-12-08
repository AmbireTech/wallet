export function onTxnRejected() {
  window.parent.postMessage({
    type: 'txnRejected',
  }, '*')
}

export function onTxnSent(hash) {
  window.parent.postMessage({
    type: 'txnSent',
    hash: hash
  }, '*')
}

export function onMsgRejected() {
  window.parent.postMessage({
    type: 'msgRejected'
  }, '*')
}

export function onMsgSigned() {
  window.parent.postMessage({
    type: 'msgSigned'
  }, '*')
}