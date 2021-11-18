import './UnknownAddress.scss'

import { MdOutlineAdd } from 'react-icons/md'
import { Checkbox } from '..'
import { useEffect, useState } from 'react'

const UnknownAddress = ({ onChange, onAddNewAddress }) => {
    const [confirmed, setConfirmed] = useState(false)

    useEffect(() => {
        if (onChange) onChange(confirmed)
    }, [confirmed, onChange])

    return (
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
    )
}

export default UnknownAddress