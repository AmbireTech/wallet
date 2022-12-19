import './AssetsMigration.scss'

import BigNumber from 'bignumber.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import assetMigrationDetector from 'lib/assetMigrationDetector'
import { ZERO_ADDRESS } from 'consts/specialAddresses'
import AmbireLoading from 'components/common/Loading/AmbireLoading'
import { Checkbox, TextInput, Button, Loading } from 'components/common'
import { GiToken } from 'react-icons/gi'
import { fetchGet } from 'lib/fetch'
import { MdClose, MdOutlineNavigateNext, MdOutlineAddCircleOutline, MdCancel } from 'react-icons/md'
import { Contract, ethers } from 'ethers'
import { ERC20PermittableInterface } from 'consts/permittableCoins'
import { getProvider } from 'ambire-common/src/services/provider'
import { GAS_SPEEDS } from 'ambire-common/src/constants/gasSpeeds'

const TRANSFER_CONSUMPTION = 52000 // higher avg, 21000 included

const AssetsMigrationSelector = ({ signerAccount, identityAccount, network, setIsSelectionConfirmed, setStep, portfolio, relayerURL, setModalButtons, hideModal, setSelectedTokensWithAllowance, setGasSpeed, setStepperSteps, hidden }) => {

  const [selectableTokens, setSelectableTokens] = useState([])
  const [selectableTokensUserInputs, setSelectableTokensUserInputs] = useState([])

  const [nativeToken, setNativeToken] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [failedImg, setFailedImg] = useState([])
  const [gasData, setGasData] = useState(null)
  const [estimatedGasFees, setEstimatedGasFees] = useState(null)
  const [selectedGasSpeed, setSelectedGasSpeed] = useState('fast')
  const [tokensAllowances, setTokenAllowances] = useState([])

  const [isAddCustomTokenFormShown, setIsAddCustomTokenFormShown] = useState(false)
  const [isCustomTokenPending, setIsCustomTokenPending] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState('')
  const [customTokenError, setCustomTokenError] = useState('')

  const customTokenInput = useRef()
  const inputRefs = useRef({})

  // update signerTokens state helper
  const updateSelectableTokenUserInputs = useCallback((address, callback) => {
    const index = selectableTokensUserInputs.findIndex(a => a.address === address)

    if (index !== -1) {
      const updated = callback(selectableTokensUserInputs[index])

      setSelectableTokensUserInputs([
        ...selectableTokensUserInputs.slice(0, index),
        updated,
        ...selectableTokensUserInputs.slice(index + 1),
      ])
    }
  }, [selectableTokensUserInputs])

  // Include/Exclude token in migration
  const toggleTokenSelection = useCallback((address, minHumanAmount = null) => {

    // focusing input fields on selection
    const index = selectableTokens
      .sort((a, b) => a.name < b.name ? -1 : 1)
      .findIndex(t => t.address === address)
    inputRefs.current[index]?.focus()

    updateSelectableTokenUserInputs(address, old => {
      let updated = {
        ...old,
        selected: !old.selected
      }
      if (minHumanAmount) {

        // let newHumanAmount = humanAmount.replace(/\.?0+$/g, '')
        const currentHumanAmount = selectableTokensUserInputs.find(t => t.address === address)?.humanAmount
        if (minHumanAmount > currentHumanAmount) {
          const decimals = selectableTokens.find(t => t.address === address)?.decimals

          updated.amount = new BigNumber(minHumanAmount).multipliedBy(10 ** decimals).toFixed(0)
          updated.humanAmount = minHumanAmount
        }
      }
      return updated
    })
  }, [selectableTokens, updateSelectableTokenUserInputs, selectableTokensUserInputs])

  const addCustomToken = useCallback(() => {

    const provider = getProvider(network.id)

    if (!ethers.utils.isAddress(customTokenAddress)) {
      setCustomTokenError('invalid custom token address')
      return
    }

    if (selectableTokens.find(t => t.address.toLowerCase() === customTokenAddress.toLowerCase())) {
      setCustomTokenAddress('')
      setIsAddCustomTokenFormShown(false)
      return
    }

    const tokenContract = new Contract(customTokenAddress, ERC20PermittableInterface, provider)

    const symbolPromise = tokenContract.symbol().catch(() => setCustomTokenError('Could not get symbol of token ' + customTokenAddress))
    const decimalsPromise = tokenContract.decimals().catch(() => setCustomTokenError('Could not get decimals of token ' + customTokenAddress))
    const allowancePromise = tokenContract.allowance(signerAccount, identityAccount).catch(() => setCustomTokenError('Could not get allowance for token ' + customTokenAddress))
    const availableSignerBalancePromise = tokenContract.balanceOf(signerAccount).catch(() => setCustomTokenError('Could not get balance for token ' + customTokenAddress))

    setIsCustomTokenPending(true)
    setCustomTokenError(null)

    Promise.all([
      symbolPromise,
      decimalsPromise,
      allowancePromise,
      availableSignerBalancePromise]
    ).then((promises) => {

      const [symbol, decimals, allowance, signerBalance] = promises

      setIsCustomTokenPending(false)

      if (symbol && decimals && allowance !== null && signerBalance !== null) {
        setCustomTokenAddress('')
        setIsAddCustomTokenFormShown(false)

        setSelectableTokens(old => {
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
            }
          ]
        })

        setSelectableTokensUserInputs(old => {
          return [
            ...old,
            {
              address: customTokenAddress,
              selectedAmount: 0,
              amount: signerBalance.toString(),
              humanAmount: new BigNumber(signerBalance.toString()).div(10 ** decimals.toString()).toFixed(),
              selected: signerBalance.gt(0)
            }
          ]
        })

        setTokenAllowances(old => {
          return [
            ...old,
            {
              address: customTokenAddress,
              allowance: 0
            }
          ]
        })
      }
    }).catch(err => {
      console.log('err getting custom token data', err)
      setIsCustomTokenPending(false)
    })
  }, [network, customTokenAddress, signerAccount, identityAccount, setCustomTokenError, selectableTokens])

  const canCoverGasFees = useCallback((speed) => {
    if (!estimatedGasFees) return false
    const nativeToSpend = selectableTokensUserInputs.find(t => t.address === ZERO_ADDRESS && t.selected)?.amount || 0

    return new BigNumber(estimatedGasFees.gasFees[speed].signerTransactionsCost)
      .plus(nativeToSpend)
      .lte(nativeToken.availableBalance || 0)

  }, [selectableTokensUserInputs, estimatedGasFees, nativeToken])

  const getMaxTransferableNative = useCallback((speed) => {
    return new BigNumber(nativeToken.availableBalance).minus(estimatedGasFees.gasFees[speed].signerTransactionsCost)
  }, [estimatedGasFees, nativeToken])

  const consolidatedSelectableTokens = (selectableTokens, selectableTokensUserInputs = [], tokensAllowances = []) => {
    return selectableTokens.map(st => {
      return {
        ...st,
        ...selectableTokensUserInputs.find(t => t.address === st.address),
        ...tokensAllowances.find(t => t.address === st.address)
      }
    })
  }

  // select tokens to migrate
  const confirmTokenSelection = useCallback(async () => {

    const tokensToMigrate = consolidatedSelectableTokens(selectableTokens, selectableTokensUserInputs, tokensAllowances).filter(a => a.selected)
    if (!tokensToMigrate.length) return

    setSelectedTokensWithAllowance(tokensToMigrate.map(a => {
      return {
        ...a,
      }
    }))

    setIsSelectionConfirmed(true)
    if (tokensToMigrate.find(a => a.address === ZERO_ADDRESS)) {
      setStep(1)
    } else {
      setStep(2)
    }

    setGasSpeed(selectedGasSpeed)
  }, [selectableTokens, selectableTokensUserInputs, tokensAllowances, setSelectedTokensWithAllowance, setIsSelectionConfirmed, setStep, setGasSpeed, selectedGasSpeed])

  useEffect(() => {
    if (isAddCustomTokenFormShown) {
      customTokenInput.current.focus()
    }
  }, [isAddCustomTokenFormShown])

  useEffect(() => {
    setNativeToken(selectableTokens.find(t => t.native))
  }, [selectableTokens])

  // fetch selectable tokens
  useEffect(() => {

    setIsLoading(true)
    setSelectableTokens([])

    assetMigrationDetector({ networkId: network.id, account: signerAccount }).then(assets => {
      setSelectableTokens(
        assets.map(t => {
          return {
            ...t,
          }
        })
      )

      setSelectableTokensUserInputs(assets.map(t => {
        return {
          address: t.address,
          selectedAmount: 0,
          amount: t.availableBalance,
          humanAmount: new BigNumber(t.availableBalance).div(10 ** t.decimals).toFixed(),
          selected: false
        }
      }))

      setIsLoading(false)
    }).catch(err => {
      console.error(err)
    })
  }, [signerAccount, setIsLoading, setSelectableTokens, network])

  // check Identity gas fees
  useEffect(() => {

    if (!gasData) return

    const consolidatedTokens = consolidatedSelectableTokens(selectableTokens, selectableTokensUserInputs, tokensAllowances)

    const regularTransfersCount = consolidatedTokens.filter(t => t.selected && !t.native).length
    const nativeTransfersCount = consolidatedTokens.filter(t => t.selected && t.native).length

    const adjustedApprovalCost = network.id === 'arbitrum' ? 200000 : 0

    const signerTransactionsConsumption = (regularTransfersCount * (25000 + TRANSFER_CONSUMPTION + adjustedApprovalCost)) + (nativeTransfersCount * 25000)

    const nativeRate = gasData.gasFeeAssets.native / 10 ** 18 // should decimals be returned in the API?

    const gasFees = {}
    GAS_SPEEDS.forEach(speed => {
      let gasPrice = (gasData.gasPrice[speed] + (gasData.gasPrice.maxPriorityFeePerGas ? gasData.gasPrice.maxPriorityFeePerGas[speed] * 1 : 0))

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
      gasFees,
    })

  }, [selectableTokens, selectableTokensUserInputs, portfolio, gasData, selectedGasSpeed, tokensAllowances, network])


  // getting gasPrice data from relayer
  useEffect(() => {
    fetchGet(`${relayerURL}/gasPrice/${network.id}`).then(gasData => {
      setGasData(gasData.data)
    }).catch(err => {
      console.log('fetch error', err)
    })
  }, [relayerURL, network])


  // getting erc20 token allowances
  useEffect(() => {
    const promises = selectableTokens.map(t => {
      const provider = getProvider(network.id)
      const tokenContract = new Contract(t.address, ERC20PermittableInterface, provider)

      if (!t.native) {
        return tokenContract.allowance(signerAccount, identityAccount)
          .then((allowance) => {

            return {
              address: t.address,
              allowance: allowance.toString(),
            }
          }).catch(err => {
            console.log('err getting allowance', err)
          })
      }
      return {
        address: t.address,
        allowance: 0,
      }
    })

    Promise.all(promises).then(allowanceResults => {
      setTokenAllowances(allowanceResults)
    })

  }, [identityAccount, network, selectableTokens, signerAccount])


  useEffect(() => {
    if (hidden) return
    setModalButtons(
      <>
        <Button clear small icon={<MdClose/>} onClick={hideModal}>Close</Button>
        {
          (selectableTokensUserInputs.filter(a => a.selected).length > 0 && canCoverGasFees(selectedGasSpeed))
            ? <Button small icon={<MdOutlineNavigateNext/>} className={'primary'}
                      onClick={() => confirmTokenSelection()}>Move {selectableTokensUserInputs.filter(a => a.selected).length} assets</Button>
            : <Button small icon={<MdOutlineNavigateNext/>} className={'primary disabled'}>Move assets</Button>
        }
      </>
    )
  }, [selectableTokensUserInputs, selectedGasSpeed, setModalButtons, hideModal, confirmTokenSelection, hidden, canCoverGasFees])

  const onAssetAmountChange = useCallback((val, item) => updateSelectableTokenUserInputs(item.address, (old) => {
    if (val === '') {
      return {
        ...old,
        humanAmount: 0,
        amount: 0
      }
    }
    if (
      (val.endsWith('.') && val.split('.').length === 2)
      || (val.split('.').length === 2 && (val.endsWith('0') && new BigNumber(val).isEqualTo(old.humanAmount)))
    ) {
      return {
        ...old,
        humanAmount: val,
      }
    }

    if (!isNaN(val)) {
      let newHumanAmount = new BigNumber(val).toFixed(item.decimals)
      if (new BigNumber(newHumanAmount).multipliedBy(10 ** item.decimals).comparedTo(item.availableBalance) === 1) {
        newHumanAmount = new BigNumber(item.availableBalance).dividedBy(10 ** item.decimals).toFixed(item.decimals)
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
  }), [updateSelectableTokenUserInputs])

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 250)
  }, [selectableTokens])

  // Stepper
  useEffect(() => {

    const steps = ['Selection']

    const native = selectableTokensUserInputs.find(a => a.address.toLowerCase() === ZERO_ADDRESS && a.selected)
    if (native) {
      steps.push(`Send ${selectableTokens.find(t => t.address === native.address).name}`)
    }

    if (selectableTokensUserInputs.find(a => a.address.toLowerCase() !== ZERO_ADDRESS && a.selected)) {

      let tokensTitleActions = []
      if (selectableTokensUserInputs.find(a => a.selected && a.address.toLowerCase() !== ZERO_ADDRESS)) tokensTitleActions.push('Send')

      steps.push(tokensTitleActions.join(' and ') + ' tokens')

    }

    if (steps.length === 1) {
      steps.push('Send tokens')
    }

    setStepperSteps(steps)
  }, [selectableTokens, selectableTokensUserInputs, setStepperSteps, network])

  if (hidden) return <></>

  return (
    <div>
      {
        isLoading
          ?
          <div className={'content-center'}>
            <h3 className={'mb-6'}>Loading assets...</h3>
            <AmbireLoading/>
          </div>
          :
          <div>
            {
              selectableTokens.length === 0
                ? <div>No assets to migrate have been found</div>
                :
                <div>
                  <div className={'mb-4'}>Please select the assets you would like to migrate from your signer wallet to
                    your Ambire wallet
                  </div>
                  {
                    consolidatedSelectableTokens(selectableTokens, selectableTokensUserInputs)
                      .sort((a, b) => a.name < b.name ? -1 : 1)
                      .map((item, index) => (
                        <div className='migration-asset-row' key={index}>
                          <div className={`migration-asset-select${item.selected ? ' checked' : ''}`}
                               onClick={() => false}>
                            <Checkbox
                              labelClassName='checkbox-label'
                              id={`check-${item.address}`}
                              label={<span className={'migration-asset-select-label'}>
                                  <span className='migration-asset-select-icon'>
                                    {
                                      (failedImg.includes(item.icon) || !item.icon) ?
                                        <GiToken size={18}/>
                                        :
                                        <img src={item.icon} draggable='false' alt='Token Icon' onError={(err) => {
                                          setFailedImg(failed => [...failed, item.icon])
                                        }}/>
                                    }
                                </span>
                                <span className='migration-asset-select-name'>{item.name}</span>
                              </span>}
                              checked={item.selected}
                              onChange={() => toggleTokenSelection(item.address)}
                            />
                          </div>
                          <div className='migration-asset-usd'>
                            ${((item.amount) * item.rate).toFixed(2)}
                          </div>
                          <div className='migration-asset-amount'>
                            <TextInput
                              ref={(element) => inputRefs.current[index] = element}
                              className={'migrate-amount-input'}
                              value={item.humanAmount}
                              onChange={(val) => onAssetAmountChange(val, item)}
                            />
                          </div>
                        </div>
                      ))
                  }
                  <div className={'custom-token-row mt-2'}>
                    {
                      isAddCustomTokenFormShown
                        ? <div>
                          {
                            isCustomTokenPending
                              ? <div className={'custom-token-message-fetching'}>
                                <Loading/>
                                Fetching custom token data...
                              </div>
                              : <>
                                {
                                  customTokenError && <div className={'error'}>{customTokenError}</div>
                                }
                                <div>
                                  <TextInput
                                    className={'custom-token-input'}
                                    placeholder={'Enter custom token address'}
                                    value={customTokenAddress}
                                    onChange={(val) => {
                                      setCustomTokenAddress(val)
                                    }}
                                    ref={customTokenInput}
                                  />
                                </div>
                                <div className={'flex-row mt-2'}>
                                  <Button small icon={<MdCancel/>} className={'buttonHollow danger align-right'}
                                          onClick={() => {
                                            setIsAddCustomTokenFormShown(false)
                                            setCustomTokenAddress('')
                                            setCustomTokenError(null)
                                          }}>Cancel</Button>
                                  <Button small icon={<MdOutlineAddCircleOutline/>} className={'primary ms-4'}
                                          onClick={() => addCustomToken()}>Add</Button>
                                </div>
                              </>
                          }
                        </div>
                        : <Button small icon={<MdOutlineAddCircleOutline/>} className={'clear align-right'}
                                  onClick={() => setIsAddCustomTokenFormShown(true)}
                        >Add custom token</Button>
                    }
                  </div>
                  {
                    !canCoverGasFees(selectedGasSpeed) && selectableTokensUserInputs.filter(a => a.selected).length > 0 &&
                    <div className={'notification-hollow warning mt-3 mb-3'}>
                      Your Signer Wallet will not have enough fees to pay for the migration.
                      Please transfer a maximum of <span className={'max-native-suggestion'}
                                                         onClick={() => onAssetAmountChange(new BigNumber(getMaxTransferableNative(selectedGasSpeed)).dividedBy(10 ** nativeToken.decimals).toFixed(6, BigNumber.ROUND_DOWN), nativeToken)}>
                        {new BigNumber(getMaxTransferableNative(selectedGasSpeed)).dividedBy(10 ** nativeToken.decimals).toFixed(6, BigNumber.ROUND_DOWN)} {network.nativeAssetSymbol}
                      </span>
                    </div>
                  }
                  {
                    estimatedGasFees &&
                    <div className={'gas-estimation-block mt-4'}>
                      <div className={'gas-estimation-block-title'}>Estimated gas fee</div>
                      <ul className={'gas-estimation-selector'}>
                        {
                          Object.values(estimatedGasFees.gasFees).map((f, index) => {
                              return (<li key={index} className={f.speed === selectedGasSpeed ? 'selected' : ''}
                                          onClick={() => setSelectedGasSpeed(f.speed)}>{f.speed}</li>)
                            }
                          )
                        }
                      </ul>
                      <table className={'gas-estimation-details'}>
                        <tbody>
                        <tr>
                          <td>
                            Signer fee
                            {
                              (!!estimatedGasFees.nativeTransfersCount || !!estimatedGasFees.regularTransfersCount) &&
                              <span className={'migration-actions'}>
                                  <span>{estimatedGasFees.nativeTransfersCount + estimatedGasFees.regularTransfersCount} transfers</span>
                              </span>
                            }
                          </td>
                          <td
                            className={'gas-estimation-details-amount'}>${estimatedGasFees.gasFees[selectedGasSpeed].signerTransactionsCostUSD.toFixed(2)}</td>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
            }
          </div>
      }
    </div>
  )
}

export default AssetsMigrationSelector
