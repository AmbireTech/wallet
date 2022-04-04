import { Resolution } from '@unstoppabledomains/resolution'
const resolution = new Resolution();

function getMessage(e) {
    if (e === 'UnregisteredDomain') return 'Domain is not registered'
    else if (e === 'RecordNotFound') return 'Crypto record is not found (or empty)'
    else if (e === 'UnspecifiedResolver') return 'Domain is not configured (empty resolver)'
    else if (e === 'UnsupportedDomain') return 'Domain is not supported'
    else return 'Domain is not registered'
}

async function resolveAddress(domain) {
    return resolution
        .addr(domain, 'ETH')
        .then(addr => ({success: true, address: addr}))
        .catch(e => ({success: false, code: e.code, message: getMessage(e.code)}))
}

async function resolveAddressMultiChain(domain, currency, chain) {
    return resolution
        .multiChainAddr(domain, currency, chain)
        .then(addr => ({success: true, address: addr}))
        .catch(e => ({success: false, code: e.code, message: getMessage(e.code)}))
}

async function resolveUDomain(domain, currency, chain) {
    const [nativeUDAddress, customUDAddress] = await Promise.all([
        resolveAddress(domain),
        resolveAddressMultiChain(domain, currency, chain)
    ])
    return (customUDAddress.success ? customUDAddress.address : nativeUDAddress.success ? nativeUDAddress.address : null)
}

export {
    resolveUDomain
}