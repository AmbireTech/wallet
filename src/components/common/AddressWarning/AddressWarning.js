import './AddressWarning.scss'

import { MdOutlineAdd } from 'react-icons/md'
import { Checkbox } from 'components/common'
import { useEffect, useMemo, useState } from 'react'
import { isValidAddress, isKnownTokenOrContract } from 'lib/address';

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
        </>
    )
}

export default AddressWarning