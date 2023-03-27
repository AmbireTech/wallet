import { useCallback, useEffect, useRef, useState } from 'react'
import { Contract } from 'ethers'
import BigNumber from 'bignumber.js'
import { GAS_SPEEDS } from 'ambire-common/src/constants/gasSpeeds'

import { getProvider } from 'ambire-common/src/services/provider'
import { ZERO_ADDRESS } from 'consts/specialAddresses'
import { ERC20PermittableInterface } from 'consts/permittableCoins'
import { fetchGet } from 'lib/fetch'
import assetMigrationDetector from 'lib/assetMigrationDetector'

import { Button } from 'components/common'
import AmbireLoading from 'components/common/Loading/AmbireLoading'
import EstimatedGasFees from './EstimatedGasFees/EstimatedGasFees'
import FeesAffordability from './FeesAffordability/FeesAffordability'
import CustomTokenForm from './CustomTokenForm/CustomTokenForm'
import MigratableAssets from './MigratableAssets/MigratableAssets'

import styles from './AssetsMigrationSelector.module.scss'

const TRANSFER_CONSUMPTION = 52000 // higher avg, 21000 included

const AssetsMigrationSelector = ({
  signerAccount,
  identityAccount,
  network,
  setIsSelectionConfirmed,
  setStep,
  portfolio,
  relayerURL,
  setModalButtons,
  hideModal,
  setSelectedTokensWithAllowance,
  setGasSpeed,
  setStepperSteps,
  hidden
}) => {
  const [selectableTokens, setSelectableTokens] = useState([])
  const [selectableTokensUserInputs, setSelectableTokensUserInputs] = useState([])

  const [nativeToken, setNativeToken] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [gasData, setGasData] = useState(null)
  const [estimatedGasFees, setEstimatedGasFees] = useState(null)
  const [selectedGasSpeed, setSelectedGasSpeed] = useState('fast')
  const [tokensAllowances, setTokenAllowances] = useState([])
  const inputRefs = useRef({})

  // update signerTokens state helper
  const updateSelectableTokenUserInputs = useCallback(
    (address, callback) => {
      const index = selectableTokensUserInputs.findIndex((a) => a.address === address)

      if (index !== -1) {
        const updated = callback(selectableTokensUserInputs[index])

        setSelectableTokensUserInputs([
          ...selectableTokensUserInputs.slice(0, index),
          updated,
          ...selectableTokensUserInputs.slice(index + 1)
        ])
      }
    },
    [selectableTokensUserInputs]
  )

  const canCoverGasFees = useCallback(
    (speed) => {
      if (!estimatedGasFees) return false
      const nativeToSpend =
        selectableTokensUserInputs.find((t) => t.address === ZERO_ADDRESS && t.selected)?.amount ||
        0

      return new BigNumber(estimatedGasFees.gasFees[speed].signerTransactionsCost)
        .plus(nativeToSpend)
        .lte(nativeToken?.availableBalance || 0)
    },
    [selectableTokensUserInputs, estimatedGasFees, nativeToken]
  )

  const consolidatedSelectableTokens = (
    selectableTokens,
    selectableTokensUserInputs = [],
    tokensAllowances = []
  ) => {
    return selectableTokens.map((st) => {
      return {
        ...st,
        ...selectableTokensUserInputs.find((t) => t.address === st.address),
        ...tokensAllowances.find((t) => t?.address === st.address)
      }
    })
  }

  // select tokens to migrate
  const confirmTokenSelection = useCallback(async () => {
    const tokensToMigrate = consolidatedSelectableTokens(
      selectableTokens,
      selectableTokensUserInputs,
      tokensAllowances
    ).filter((a) => a.selected)
    if (!tokensToMigrate.length) return

    setSelectedTokensWithAllowance(
      tokensToMigrate.map((a) => {
        return {
          ...a
        }
      })
    )

    setIsSelectionConfirmed(true)
    if (tokensToMigrate.find((a) => a.address === ZERO_ADDRESS)) {
      setStep(1)
    } else {
      setStep(2)
    }

    setGasSpeed(selectedGasSpeed)
  }, [
    selectableTokens,
    selectableTokensUserInputs,
    tokensAllowances,
    setSelectedTokensWithAllowance,
    setIsSelectionConfirmed,
    setStep,
    setGasSpeed,
    selectedGasSpeed
  ])

  useEffect(() => {
    setNativeToken(selectableTokens.find((t) => t.native))
  }, [selectableTokens])

  // fetch selectable tokens
  useEffect(() => {
    setIsLoading(true)
    setSelectableTokens([])

    assetMigrationDetector({ networkId: network.id, account: signerAccount })
      .then((assets) => {
        setSelectableTokens(
          assets.map((t) => {
            return {
              ...t
            }
          })
        )

        setSelectableTokensUserInputs(
          assets.map((t) => {
            return {
              address: t.address,
              selectedAmount: 0,
              amount: t.availableBalance,
              humanAmount: new BigNumber(t.availableBalance).div(10 ** t.decimals).toFixed(),
              selected: false
            }
          })
        )

        setIsLoading(false)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [signerAccount, setIsLoading, setSelectableTokens, network])

  // check Identity gas fees
  useEffect(() => {
    if (!gasData) return

    const consolidatedTokens = consolidatedSelectableTokens(
      selectableTokens,
      selectableTokensUserInputs,
      tokensAllowances
    )

    const regularTransfersCount = consolidatedTokens.filter((t) => t.selected && !t.native).length
    const nativeTransfersCount = consolidatedTokens.filter((t) => t.selected && t.native).length

    const adjustedApprovalCost = network.id === 'arbitrum' ? 200000 : 0

    const signerTransactionsConsumption =
      regularTransfersCount * (25000 + TRANSFER_CONSUMPTION + adjustedApprovalCost) +
      nativeTransfersCount * 25000

    const nativeRate = gasData.gasFeeAssets.native / 10 ** 18 // should decimals be returned in the API?

    const gasFees = {}
    GAS_SPEEDS.forEach((speed) => {
      const gasPrice =
        gasData.gasPrice[speed] +
        (gasData.gasPrice.maxPriorityFeePerGas
          ? gasData.gasPrice.maxPriorityFeePerGas[speed] * 1
          : 0)

      const signerTransactionsCost = signerTransactionsConsumption * gasPrice
      const signerTransactionsCostUSD = signerTransactionsCost * nativeRate

      gasFees[speed] = {
        speed,
        signerTransactionsCost,
        signerTransactionsCostUSD,
        signerTransactionsConsumption
      }
    })

    setEstimatedGasFees({
      regularTransfersCount,
      nativeTransfersCount,
      gasFees
    })
  }, [
    selectableTokens,
    selectableTokensUserInputs,
    portfolio,
    gasData,
    selectedGasSpeed,
    tokensAllowances,
    network
  ])

  // getting gasPrice data from relayer
  useEffect(() => {
    fetchGet(`${relayerURL}/gasPrice/${network.id}`)
      .then((gasData) => {
        setGasData(gasData.data)
      })
      .catch((err) => {
        console.log('fetch error', err)
      })
  }, [relayerURL, network])

  // getting erc20 token allowances
  useEffect(() => {
    const promises = selectableTokens.map((t) => {
      const provider = getProvider(network.id)
      const tokenContract = new Contract(t.address, ERC20PermittableInterface, provider)

      if (!t.native) {
        return tokenContract
          .allowance(signerAccount, identityAccount)
          .then((allowance) => {
            return {
              address: t.address,
              allowance: allowance.toString()
            }
          })
          .catch((err) => {
            console.log('err getting allowance', err)
          })
      }
      return {
        address: t.address,
        allowance: 0
      }
    })

    Promise.all(promises).then((allowanceResults) => {
      setTokenAllowances(allowanceResults)
    })
  }, [identityAccount, network, selectableTokens, signerAccount])

  useEffect(() => {
    if (hidden) return
    setModalButtons(
      <>
        <Button clear small onClick={hideModal}>
          Close
        </Button>
        {selectableTokensUserInputs.filter((a) => a.selected).length > 0 &&
        canCoverGasFees(selectedGasSpeed) ? (
          <Button small primaryGradient onClick={() => confirmTokenSelection()}>
            Move {selectableTokensUserInputs.filter((a) => a.selected).length} assets
          </Button>
        ) : (
          <Button small primaryGradient disabled>
            Move assets
          </Button>
        )}
      </>
    )
  }, [
    selectableTokensUserInputs,
    selectedGasSpeed,
    setModalButtons,
    hideModal,
    confirmTokenSelection,
    hidden,
    canCoverGasFees
  ])

  const onAssetAmountChange = useCallback(
    (val, item) =>
      updateSelectableTokenUserInputs(item.address, (old) => {
        if (val === '') {
          return {
            ...old,
            humanAmount: 0,
            amount: 0
          }
        }
        if (
          (val.endsWith('.') && val.split('.').length === 2) ||
          (val.split('.').length === 2 &&
            val.endsWith('0') &&
            new BigNumber(val).isEqualTo(old.humanAmount))
        ) {
          return {
            ...old,
            humanAmount: val
          }
        }

        if (!isNaN(val)) {
          let newHumanAmount = new BigNumber(val).toFixed(item.decimals)
          if (
            new BigNumber(newHumanAmount)
              .multipliedBy(10 ** item.decimals)
              .comparedTo(item.availableBalance) === 1
          ) {
            newHumanAmount = new BigNumber(item.availableBalance)
              .dividedBy(10 ** item.decimals)
              .toFixed(item.decimals)
          }
          // trim trailing . or 0
          newHumanAmount = newHumanAmount.replace(/\.?0+$/g, '')

          return {
            ...old,
            humanAmount: newHumanAmount,
            amount: new BigNumber(newHumanAmount).multipliedBy(10 ** item.decimals).toFixed(0)
          }
        }
        return old
      }),
    [updateSelectableTokenUserInputs]
  )

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 250)
  }, [selectableTokens])

  // Stepper
  useEffect(() => {
    const steps = ['Selection']

    const native = selectableTokensUserInputs.find(
      (a) => a.address.toLowerCase() === ZERO_ADDRESS && a.selected
    )
    if (native) {
      steps.push(`Send ${selectableTokens.find((t) => t.address === native.address).name}`)
    }

    if (
      selectableTokensUserInputs.find((a) => a.address.toLowerCase() !== ZERO_ADDRESS && a.selected)
    ) {
      const tokensTitleActions = []
      if (
        selectableTokensUserInputs.find(
          (a) => a.selected && a.address.toLowerCase() !== ZERO_ADDRESS
        )
      )
        tokensTitleActions.push('Send')

      steps.push(`${tokensTitleActions.join(' and ')} tokens`)
    }

    if (steps.length === 1) {
      steps.push('Send tokens')
    }

    setStepperSteps(steps)
  }, [selectableTokens, selectableTokensUserInputs, setStepperSteps, network])

  if (hidden) return <></>

  return (
    <div className={styles.wrapper}>
      {isLoading ? (
        <div className={styles.loading}>
          <AmbireLoading />
        </div>
      ) : (
        <div>
          {selectableTokens.length === 0 ? (
            <div>No assets to migrate have been found</div>
          ) : (
            <div>
              <h2 className={styles.title}>
                Please select the assets you would like to migrate from your signer wallet to your
                Ambire wallet
              </h2>
              <MigratableAssets
                selectableTokens={selectableTokens}
                selectableTokensUserInputs={selectableTokensUserInputs}
                consolidatedSelectableTokens={consolidatedSelectableTokens}
                inputRefs={inputRefs}
                updateSelectableTokenUserInputs={updateSelectableTokenUserInputs}
                onAssetAmountChange={onAssetAmountChange}
              />
              <CustomTokenForm
                network={network}
                selectableTokens={selectableTokens}
                signerAccount={signerAccount}
                setSelectableTokens={setSelectableTokens}
                identityAccount={identityAccount}
                setTokenAllowances={setTokenAllowances}
                setSelectableTokensUserInputs={setSelectableTokensUserInputs}
              />
              <FeesAffordability
                canCoverGasFees={canCoverGasFees}
                onAssetAmountChange={onAssetAmountChange}
                nativeToken={nativeToken}
                estimatedGasFees={estimatedGasFees}
                selectedGasSpeed={selectedGasSpeed}
                selectableTokensUserInputs={selectableTokensUserInputs}
                network={network}
              />
              <EstimatedGasFees
                estimatedGasFees={estimatedGasFees}
                selectedGasSpeed={selectedGasSpeed}
                setSelectedGasSpeed={setSelectedGasSpeed}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AssetsMigrationSelector
