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
    return new Promise((resolve, reject) => {
        resolution
            .addr(domain, 'ETH')
            .then(addr => resolve({success: true, address: addr}))
            .catch(e => resolve({success: false, code: e.code, message: getMessage(e.code)}))
    })
}

async function resolveAddressMultiChain(domain, currency, chain) {
    return new Promise((resolve, reject) => {
        resolution
            .multiChainAddr(domain, currency, chain)
            .then(addr => resolve({success: true, address: addr}))
            .catch(e => resolve({success: false, code: e.code, message: getMessage(e.code)}))
    })
}

export {
    resolveAddress,
    resolveAddressMultiChain
}