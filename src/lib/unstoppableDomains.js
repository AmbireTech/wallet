import { Resolution } from '@unstoppabledomains/resolution'
import { rpcUrls } from 'config/providers'
import networks from 'ambire-common/src/constants/networks'

function getLocations() {
    let locations = {}
    networks.forEach(({ id }, index) => {
        locations = { ...locations, 
            [`Layer${index+1}`]: {
                url: rpcUrls[id],
                network: id === 'ethereum' ? 'mainnet' : `${id}-mainnet`
            }
        }
    })

    return locations
}

const resolution = new Resolution({
    sourceConfig: {
        uns: {
            locations: getLocations()
        }
    }
})
        
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