import cn from 'classnames'
import { MdWarning } from 'react-icons/md'

import { AddressBook, ToolTip } from 'components/common'

import ENSLogoImage from 'resources/ens-logo-active.png'
import UDLogoImage from 'resources/ud-logo-active.png'

import styles from './RecipientInput.module.scss'

const RecipientInput = ({
  gasTankDetails,
  address,
  setAddress,
  ensAddress,
  uDAddress,
  addAddress,
  removeAddress,
  newAddress,
  setNewAddress,
  addresses,
  selectedAcc,
  selectedNetwork
}) => {
  return gasTankDetails ? (
    <p className={styles.gasTankMsg}>
      <MdWarning />
      {gasTankDetails?.gasTankMsg}
    </p>
  ) : (
    <div className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        <input
          placeholder="Recipient"
          value={address}
          onInput={(e) => setAddress(e.target.value)}
          testId="recipient"
          className={styles.input}
        />
				<ToolTip label={!uDAddress ? 'You can use Unstoppable domainsⓇ' : 'Valid Unstoppable domainsⓇ domain'}>
					<img
						src={UDLogoImage}
						alt="udaddress-logo"
						className={cn(styles.inputLogo, {
							[styles.active]: uDAddress
						})}
					/>
				</ToolTip>
        <ToolTip label={!ensAddress ? 'You can use Ethereum Name ServiceⓇ' : 'Valid Ethereum Name ServicesⓇ domain'}>
          <img
            src={ENSLogoImage}
            alt="ens-logo"
            className={cn(styles.inputLogo, {
              [styles.active]: ensAddress
            })}
          />
        </ToolTip>
      </div>
      <p className={styles.doubleCheckMessage}>Please double-check the recipient address, blockchain transactions are not reversible.</p>
      <AddressBook
        addresses={addresses.filter((x) => x.address !== selectedAcc)}
        addAddress={addAddress}
        removeAddress={removeAddress}
        newAddress={newAddress}
        onClose={() => setNewAddress(null)}
        onSelectAddress={(address) => setAddress(address)}
        selectedNetwork={selectedNetwork}
        className={styles.addressBook}
      />
    </div>
  )
}

export default RecipientInput
