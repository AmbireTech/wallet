import { useCallback, useState } from 'react'
import BigNumber from 'bignumber.js'

import { Checkbox, TextInput } from 'components/common'

import { GiToken } from 'react-icons/gi'

import styles from './MigratableAssets.module.scss'

const MigratableAssets = ({
  selectableTokens,
  selectableTokensUserInputs,
  consolidatedSelectableTokens,
  inputRefs,
  updateSelectableTokenUserInputs,
  onAssetAmountChange
}) => {
  const [failedImg, setFailedImg] = useState([])
  // Include/Exclude token in migration
  const toggleTokenSelection = useCallback(
    (address, minHumanAmount = null) => {
      // focusing input fields on selection
      const index = selectableTokens
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .findIndex((t) => t.address === address)
      inputRefs.current[index]?.focus()

      updateSelectableTokenUserInputs(address, (old) => {
        const updated = {
          ...old,
          selected: !old.selected
        }
        if (minHumanAmount) {
          // let newHumanAmount = humanAmount.replace(/\.?0+$/g, '')
          const currentHumanAmount = selectableTokensUserInputs.find(
            (t) => t.address === address
          )?.humanAmount
          if (minHumanAmount > currentHumanAmount) {
            const decimals = selectableTokens.find((t) => t.address === address)?.decimals

            updated.amount = new BigNumber(minHumanAmount).multipliedBy(10 ** decimals).toFixed(0)
            updated.humanAmount = minHumanAmount
          }
        }
        return updated
      })
    },
    [selectableTokens, updateSelectableTokenUserInputs, selectableTokensUserInputs, inputRefs]
  )

  return consolidatedSelectableTokens(selectableTokens, selectableTokensUserInputs)
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((item, index) => (
      <div className={styles.wrapper} key={index}>
        <div className={styles.checkboxWrapper} onClick={() => false}>
          <Checkbox
            className={styles.checkbox}
            labelClassName={styles.checkboxLabel}
            id={`check-${item.address}`}
            label={
              <span className={styles.checkboxLabel}>
                {failedImg.includes(item.icon) || !item.icon ? (
                  <GiToken size={18} />
                ) : (
                  <img
                    src={item.icon}
                    className={styles.tokenIcon}
                    draggable="false"
                    alt="Token Icon"
                    onError={(err) => {
                      setFailedImg((failed) => [...failed, item.icon])
                    }}
                  />
                )}
                <span className={styles.tokenName}>{item.name}</span>
              </span>
            }
            checked={item.selected}
            onChange={() => toggleTokenSelection(item.address)}
          />
        </div>
        <div className={styles.amountWrapper}>
          <p className={styles.amountUsd}>${(item.amount * item.rate).toFixed(2)}</p>
          <TextInput
            ref={(element) => (inputRefs.current[index] = element)}
            className={styles.amountInput}
            value={item.humanAmount}
            onChange={(val) => onAssetAmountChange(val, item)}
          />
        </div>
      </div>
    ))
}

export default MigratableAssets
