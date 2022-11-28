import { useCallback, useRef, useState, useEffect } from 'react'
import { ethers, Contract } from 'ethers'
import BigNumber from 'bignumber.js'
import cn from 'classnames'

import { ERC20PermittableInterface } from 'consts/permittableCoins'
import { getProvider } from 'ambire-common/src/services/provider'

import { Button, Loading, TextInput } from 'components/common'

import styles from './CustomTokenForm.module.scss'

const CustomTokenForm = ({
  network,
  selectableTokens,
  signerAccount,
  setSelectableTokens,
  identityAccount,
  setTokenAllowances,
  setSelectableTokensUserInputs,
}) => {
  const [isAddCustomTokenFormShown, setIsAddCustomTokenFormShown] = useState(false)
  const [isCustomTokenPending, setIsCustomTokenPending] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState('')
  const [customTokenError, setCustomTokenError] = useState('')

  const customTokenInput = useRef()

  const addCustomToken = useCallback(() => {
    const provider = getProvider(network.id)

    if (!ethers.utils.isAddress(customTokenAddress)) {
      setCustomTokenError('invalid custom token address')
      return
    }

    if (selectableTokens.find((t) => t.address.toLowerCase() === customTokenAddress.toLowerCase())) {
      setCustomTokenAddress('')
      setIsAddCustomTokenFormShown(false)
      return
    }

    const tokenContract = new Contract(customTokenAddress, ERC20PermittableInterface, provider)

    const symbolPromise = tokenContract
      .symbol()
      .catch(() => setCustomTokenError('Could not get symbol of token ' + customTokenAddress))
    const decimalsPromise = tokenContract
      .decimals()
      .catch(() => setCustomTokenError('Could not get decimals of token ' + customTokenAddress))
    const allowancePromise = tokenContract
      .allowance(signerAccount, identityAccount)
      .catch(() => setCustomTokenError('Could not get allowance for token ' + customTokenAddress))
    const availableSignerBalancePromise = tokenContract
      .balanceOf(signerAccount)
      .catch(() => setCustomTokenError('Could not get balance for token ' + customTokenAddress))

    setIsCustomTokenPending(true)
    setCustomTokenError(null)

    Promise.all([symbolPromise, decimalsPromise, allowancePromise, availableSignerBalancePromise])
      .then((promises) => {
        const [symbol, decimals, allowance, signerBalance] = promises

        setIsCustomTokenPending(false)

        if (symbol && decimals && allowance !== null && signerBalance !== null) {
          setCustomTokenAddress('')
          setIsAddCustomTokenFormShown(false)

          setSelectableTokens((old) => {
            return [
              ...old,
              {
                address: customTokenAddress,
                name: symbol,
                decimals: decimals.toNumber(),
                icon: null,
                rate: 0,
                native: false,
                availableBalance: signerBalance.toString(),
                balanceUSD: 0,
              },
            ]
          })

          setSelectableTokensUserInputs((old) => {
            return [
              ...old,
              {
                address: customTokenAddress,
                selectedAmount: 0,
                amount: signerBalance.toString(),
                humanAmount: new BigNumber(signerBalance.toString()).div(10 ** decimals.toString()).toFixed(),
                selected: signerBalance.gt(0),
              },
            ]
          })

          setTokenAllowances((old) => {
            return [
              ...old,
              {
                address: customTokenAddress,
                allowance: 0,
              },
            ]
          })
        }
      })
      .catch((err) => {
        console.log('err getting custom token data', err)
        setIsCustomTokenPending(false)
      })
  }, [
    network,
    customTokenAddress,
    signerAccount,
    identityAccount,
    setCustomTokenError,
    selectableTokens,
    setSelectableTokens,
    setSelectableTokensUserInputs,
    setTokenAllowances,
  ])

  useEffect(() => {
    if (isAddCustomTokenFormShown) {
      customTokenInput.current.focus()
    }
  }, [isAddCustomTokenFormShown])

  return (
    <div className={styles.wrapper}>
      {isAddCustomTokenFormShown ? (
        <div>
          {isCustomTokenPending ? (
            <div className={styles.loading}>
              <Loading />
              Fetching custom token data...
            </div>
          ) : (
            <>
              {customTokenError && <div className={styles.error}>{customTokenError}</div>}
              <div>
                <TextInput
                  className={styles.input}
                  placeholder={'Enter custom token address'}
                  value={customTokenAddress}
                  onChange={(val) => {
                    setCustomTokenAddress(val)
                  }}
                  small
                  ref={customTokenInput}
                />
              </div>
              <div className={styles.buttons}>
                <Button
                  small
                  danger
                  onClick={() => {
                    setIsAddCustomTokenFormShown(false)
                    setCustomTokenAddress('')
                    setCustomTokenError(null)
                  }}
                  className={styles.button}
                >
                  Cancel
                </Button>
                <Button small primaryGradient onClick={() => addCustomToken()} className={styles.button}>
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <Button
          small
          border
          onClick={() => setIsAddCustomTokenFormShown(true)}
          className={cn(styles.button, styles.openFormButton)}
        >
          Add custom token
        </Button>
      )}
    </div>
  )
}

export default CustomTokenForm
