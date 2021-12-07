import { isValidAddress, isKnownTokenOrContract } from "../../helpers/address"

const validateAddress = address => {
    if (!(address && address.length)) {
        return {
            success: false,
            message: ''
        }
    }

    if (!(address && isValidAddress(address))) {
        return {
            success: false,
            message: 'Invalid address.'
        }
    }

    return { success: true }
}

const validateAddAuthSignerAddress = (address, selectedAcc) => {
    const isValidAddr = validateAddress(address)
    if (!isValidAddr.success) return isValidAddr

    if (address && selectedAcc && (address === selectedAcc)) {
        return {
            success: false,
            message: 'The entered address should be different than the your own account address.'
        }
    }
    
    return { success: true }
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
            message: 'You are trying to send tokens to a smart contract. Doing so would burn them.'
        }
    }

    if (address && (!isKnownAddress(address) && !addressConfirmed)) {
        return {
            success: false,
            message: `You're trying to send to an unknown address. If you're really sure, confirm using the checkbox below.`
        }
    }

    return { success: true }
}

const validateSendTransferAmount = (amount, selectedAsset) => {
    if (!(amount && amount.length)) {
        return {
            success: false,
            message: ''
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

    return { success: true }
}

const validateSendNftAddress = (address, selectedAcc, addressConfirmed, isKnownAddress, metadata, selectedNetwork, network) => {
    const isValidAddr = validateSendTransferAddress(address, selectedAcc, addressConfirmed, isKnownAddress)
    if (!isValidAddr.success) return isValidAddr

    if (metadata && selectedAcc && (metadata.owner?.address !== selectedAcc)) {
        return {
            success: false,
            message: `The NFT you're trying to send is not owned by you!`
        }
    }

    if (selectedNetwork && network && (selectedNetwork.id !== network)) {
        return {
            success: false,
            message: 'The selected network is not the correct one.'
        }
    }

    return { success: true }
}

export {
    validateAddAuthSignerAddress,
    validateSendNftAddress,
    validateSendTransferAddress,
    validateSendTransferAmount
}
