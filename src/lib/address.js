import { names, tokens } from 'consts/humanizerInfo'

const isValidAddress = address => /^0x[a-fA-F0-9]{40}$/.test(address)

const isKnownTokenOrContract = address => {
    const addressToLowerCase = address.toLowerCase()
    const tokensAddresses = Object.keys(tokens)
    const contractsAddresses = Object.keys(names)
    return tokensAddresses.includes(addressToLowerCase) || contractsAddresses.includes(addressToLowerCase)
}

export {
    isValidAddress,
    isKnownTokenOrContract
}