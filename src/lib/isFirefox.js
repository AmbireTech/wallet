export function isFirefox() {
  return typeof (navigator) !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox')
}
