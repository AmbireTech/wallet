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