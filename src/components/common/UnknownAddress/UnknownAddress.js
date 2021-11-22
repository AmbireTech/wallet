import './UnknownAddress.scss'

import { MdOutlineAdd } from 'react-icons/md'
import { Checkbox } from '..'
import { useEffect, useMemo, useState } from 'react'

const UnknownAddress = ({ address, onChange, onAddNewAddress, isValidAddress, isKnownAddress }) => {
    const [confirmed, setConfirmed] = useState(false)
    const shouldShow = useMemo(() => isValidAddress(address) && !isKnownAddress(address), [address, isValidAddress, isKnownAddress])

    useEffect(() => {
        if (onChange) onChange(confirmed)
    }, [confirmed, onChange])

    return (
        shouldShow ?
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
    )
}

export default UnknownAddress