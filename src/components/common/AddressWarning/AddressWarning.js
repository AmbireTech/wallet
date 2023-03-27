import { MdOutlineAdd } from 'react-icons/md'
import { Checkbox } from 'components/common'
import { useEffect, useMemo, useState } from 'react'
import { isValidAddress, isKnownTokenOrContract } from 'ambire-common/src/services/address'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import styles from './AddressWarning.module.scss'

const AddressWarning = ({
  address,
  onChange,
  onAddNewAddress,
  isKnownAddress,
  uDAddress,
  ensAddress
}) => {
  const [confirmed, setConfirmed] = useState(false)
  const parsedAddr = uDAddress || ensAddress || address
  const unknownWarning = useMemo(
    () => isValidAddress(parsedAddr) && !isKnownAddress(parsedAddr),
    [parsedAddr, isKnownAddress]
  )
  const smartContractWarning = useMemo(() => isKnownTokenOrContract(parsedAddr), [parsedAddr])

  useEffect(() => {
    if (onChange) onChange(confirmed)
  }, [confirmed, onChange])

  return (
    <>
      {!smartContractWarning && unknownWarning && address !== accountPresets.feeCollector ? (
        <div className={styles.wrapper}>
          <Checkbox
            label="Confirm sending to a previously unknown address"
            checked={confirmed}
            onChange={({ target }) => setConfirmed(target.checked)}
            testId="unknownAddressWarning"
          />
          <div className={styles.button} onClick={onAddNewAddress}>
            <MdOutlineAdd />
            Add it to the address book
          </div>
        </div>
      ) : null}
    </>
  )
}

export default AddressWarning
