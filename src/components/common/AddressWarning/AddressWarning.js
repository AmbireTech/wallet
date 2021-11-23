import './AddressWarning.scss'

import { MdOutlineAdd } from 'react-icons/md'
import { AiOutlineWarning } from 'react-icons/ai'
import { Checkbox } from '..'
import { useEffect, useMemo, useState } from 'react'
import { isValidAddress, isKnownTokenOrContract } from '../../../helpers/address';

const AddressWarning = ({ address, onChange, onAddNewAddress, isKnownAddress }) => {
    const [confirmed, setConfirmed] = useState(false)
    const unknownWarning = useMemo(() => isValidAddress(address) && !isKnownAddress(address), [address, isKnownAddress])
    const smartContractWarning = useMemo(() => isKnownTokenOrContract(address), [address])

    useEffect(() => {
        if (onChange) onChange(confirmed)
    }, [confirmed, onChange])

    return (
        <>
            {
                !smartContractWarning && unknownWarning ?
                    <div id="unknown-address-warning">
                        <Checkbox
                            label="Confirm sending to a previously unknown address"
                            checked={confirmed}
                            onChange={({ target }) => setConfirmed(target.checked)}
                        />
                        <div className="button" onClick={onAddNewAddress}>
                            <MdOutlineAdd/>
                            Add it to the address book
                        </div>
                    </div>
                    :
                    null
            }
            {
                smartContractWarning ? 
                    <div id="smart-contract-warning">
                        <AiOutlineWarning/>
                        You are trying to send tokens to a smart contract. Doing so would burn them.
                    </div>
                    :
                    null
            }
        </>
    )
}

export default AddressWarning