export function onTxnRejected() {
  window.parent.postMessage({
    type: 'txnRejected',
  }, '*')
}