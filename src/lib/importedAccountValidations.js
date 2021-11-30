import { getAddress, hexDataLength } from 'ethers/lib/utils'

const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
const NUMBER_STRING_REGEX = /^([0-9]+\.?[0-9]*)$/
const HEX_DATA_LENGTH = 32
const TIME_LOCK_NUMBER_LENGTH = 6

const validateImportedAccountProps = acc => {
    if (!(acc.id && isValidAddress(acc.id))) return 'Failed to import JSON file: invalid id'
    if (!(acc.email && isValidEmailAddress(acc.email))) return 'Failed to import JSON file: invalid email'
    if (!(acc.signer && isValidAddress(acc.signer.address || acc.signer.quickAccManager))) return 'JSON file: invalid signer address'
    if (acc.signer.quickAccManager) {
        if (!(acc.signer.timelock && isValidTimeLock(acc.signer.timelock))) return 'Failed to import JSON file: invalid signer timelock'
        if (!(acc.signer.one && isValidAddress(acc.signer.one))) return 'Failed to import JSON file: invalid signer one'
        if (!(acc.signer.two && isValidAddress(acc.signer.two))) return 'Failed to import JSON file: invalid signer two'
    }
    
    if (!(acc.salt && isValidSalt(acc.salt))) return 'JSON file: invalid salt'
    if (!(acc.identityFactoryAddr && isValidAddress(acc.identityFactoryAddr))) return 'JSON file: invalid identity Factory Address'
    if (!(acc.baseIdentityAddr && isValidAddress(acc.baseIdentityAddr))) return 'JSON file: invalid base Identity Address'
    
    return ''
}

const isValidAddress = addr => { 
    try {
        return getAddress(addr) === addr
    } catch(e) {
        return false
    }
}
const isValidEmailAddress = addr => EMAIL_REGEX.test(addr)
const isValidTimeLock = timelock => NUMBER_STRING_REGEX.test(timelock) && timelock.toString().length === TIME_LOCK_NUMBER_LENGTH
const isValidSalt = salt => hexDataLength(salt) === HEX_DATA_LENGTH

export default validateImportedAccountProps