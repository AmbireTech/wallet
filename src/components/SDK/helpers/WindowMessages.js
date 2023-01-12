function onTxnRejected() {
  window.parent.postMessage({
    type: 'txnRejected',
  }, '*')
}

function onTxnSent(hash) {
  window.parent.postMessage({
    type: 'txnSent',
    hash: hash
  }, '*')
}

function onMsgRejected() {
  window.parent.postMessage({
    type: 'msgRejected'
  }, '*')
}

function onMsgSigned() {
  window.parent.postMessage({
    type: 'msgSigned'
  }, '*')
}

export {
  onTxnRejected,
  onTxnSent,
  onMsgRejected,
  onMsgSigned
}