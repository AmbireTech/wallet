import { isValidAddress, isKnownTokenOrContract } from "../../helpers/address"

const validateSendTransferForm = (address, selectedAcc, addressConfirmed, isKnownAddress, amount, selectedAsset) => {
    if (!(amount.length)) {
        return {
            success: false,
            message: `Please, enter an amount.`
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

    if (!(address.length)) {
        return {
            success: false,
            message: `Please, enter the recipient's address.`
        }
    }

    if (!(address && isValidAddress(address))) {
        return {
            success: false,
            message: 'Invalid address.'
        }
    }

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
            message: 'The address is unknown or not confirmed.'
        }
    }

    return { success: true, message: 'Done' }
}

export default validateSendTransferForm
