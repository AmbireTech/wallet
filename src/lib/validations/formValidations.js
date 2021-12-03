import { isValidAddress, isKnownTokenOrContract } from "../../helpers/address"

const validateAddress = address => {
    if (!(address.length)) {
        return {
            success: false,
            message: ``
        }
    }

    if (!(address && isValidAddress(address))) {
        return {
            success: false,
            message: 'Invalid address.'
        }
    }

    return { success: true, message: 'Verified' }
}

const validateAddAughtSignerAddress = (address, selectedAcc) => {
    const isValidAddr = validateAddress(address)
    if (!isValidAddr.success) return isValidAddr

    if (address && selectedAcc && (address === selectedAcc)) {
        return {
            success: false,
            message: 'The entered address should be different than the your own account address.'
        }
    }
    
    return { success: true, message: 'Verified' }
}

const validateSendTransferAddress = (address, selectedAcc, addressConfirmed, isKnownAddress) => {
    const isValidAddr = validateAddress(address)
    if (!isValidAddr.success) return isValidAddr

    if (address && selectedAcc && (address === selectedAcc)) {
        return {
            success: false,
            message: 'The entered address should be different than the your own account address.'
        }
    }
    
    if (address && isKnownTokenOrContract(address)) {
        return {
            success: false,
            message: 'The address is not known Token or Contract.'
        }
    }

    if (address && (!isKnownAddress(address) && !addressConfirmed)) {
        return {
            success: false,
            message: 'The address is unknown and not confirmed. Please confirm it bellow.'
        }
    }

    return { success: true, message: 'Verified' }
}

const validateSendTransferAmount = (amount, selectedAsset) => {
    if (!(amount.length)) {
        return {
            success: false,
            message: ``
        }
    }
    
    if (!(amount && (amount > 0))) {
        return {
            success: false,
            message: 'The amount must be greater than 0.'
        }
    }
    
    if (!(amount && selectedAsset && (amount <= selectedAsset?.balance))) {
        return {
            success: false,
            message: `The amount is greater than the asset's balance: ${selectedAsset?.balance} ${selectedAsset?.symbol}.`
        }
    }

    return { success: true, message: 'Verified' }
}

export {
    validateAddAughtSignerAddress,
    validateSendTransferAddress,
    validateSendTransferAmount
}
