import './AssetsMigration.scss'

import BigNumber from 'bignumber.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import assetMigrationDetector from 'lib/assetMigrationDetector'
import { PERMITTABLE_COINS } from 'consts/permittableCoins'
import { ZERO_ADDRESS } from 'consts/specialAddresses'
import AmbireLoading from 'components/common/Loading/AmbireLoading'
import { Checkbox, TextInput, Button, Loading } from 'components/common'
import { GiToken } from 'react-icons/gi'
import { fetchGet } from 'lib/fetch'
import { MdClose, MdOutlineNavigateNext, MdOutlineAddCircleOutline, MdCancel } from 'react-icons/md'
import { Contract, ethers } from 'ethers'
import { ERC20PermittableInterface } from 'consts/permittableCoins'
import { getProvider } from 'lib/provider'

const GAS_SPEEDS = ['slow', 'medium', 'fast', 'ape']

const AssetsMigrationSelector = ({ signerAccount, identityAccount, network, setIsSelectionConfirmed, setStep, portfolio, relayerURL, setModalButtons, hideModal, setSelectedTokensWithAllowance }) => {

  const [selectableTokens, setSelectableTokens] = useState([])
  const [selectableTokensUserInputs, setSelectableTokensUserInputs] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [failedImg, setFailedImg] = useState([])
  const [gasData, setGasData] = useState(null)
  const [suggestedGasTokens, setSuggestedGasTokens] = useState([])
  const [estimatedGasFees, setEstimatedGasFees] = useState(null)
  const [selectedGasSpeed, setSelectedGasSpeed] = useState('fast')
  const [tokensAllowances, setTokenAllowances] = useState([])

  const [isAddCustomTokenFormShown, setIsAddCustomTokenFormShown] = useState(false)
  const [isCustomTokenPending, setIsCustomTokenPending] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState('')
  const [customTokenError, setCustomTokenError] = useState('')

  const customTokenInput = useRef()

  useEffect(() => {
    if (isAddCustomTokenFormShown) {
      customTokenInput.current.focus()
    }
  }, [isAddCustomTokenFormShown])

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
              humanAmount: signerBalance.toString() / 10 ** decimals.toString(),
              selected: signerBalance.gt(0)
            }
          ]
        })

        setTokenAllowances(old => {
          return [
            ...old,
            {
              address: customTokenAddress,
              allowance: 0,
              permittable: false//I guess if not in velcro certainly not permittable
            }
          ]
        })
      }
    }).catch(err => {
      console.log('err getting custom token data', err)
      setIsCustomTokenPending(false)
    })
  }, [network, customTokenAddress, signerAccount, identityAccount, setCustomTokenError, selectableTokens])

  const canCoverGasFees = (suggestedGasTokens, speed) => {
    return !!suggestedGasTokens.filter(gt => (gt.selected && gt.isEnoughToCoverFees[speed].ifSelected) || gt.isEnoughToCoverFees[speed].ifNotSelected).length
  }

  const getSuggestedGasTokensOfSpeed = (suggestedGasTokens, speed) => {
    return suggestedGasTokens
      .filter(gt => gt.isEnoughToCoverFees[speed].ifSelected)
      .map(gt => {
        return {
          ...gt,
          minimumSelectionAmount: gt.isEnoughToCoverFees[speed].minimumSelectionAmount
        }
      })
  }

  const getSuggestedGasTokensAcceptableSpeeds = (suggestedGasTokens) => {
    return GAS_SPEEDS.filter(speed => !!suggestedGasTokens.filter(gt => (gt.selected && gt.isEnoughToCoverFees[speed].ifSelected) || gt.isEnoughToCoverFees[speed].ifNotSelected).length)
  }

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
  }, [selectableTokens, selectableTokensUserInputs, tokensAllowances, setSelectedTokensWithAllowance, setIsSelectionConfirmed, setStep])

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
          humanAmount: t.availableBalance / 10 ** t.decimals,
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

    const permitsCount = consolidatedTokens.filter(t => t.selected && t.permittable && new BigNumber(t.allowance).isLessThan(t.amount)).length
    const transfersCount = consolidatedTokens.filter(t => t.selected && !t.native).length
    const nativeTransfersCount = consolidatedTokens.filter(t => t.selected && t.native).length

    const approvalCounts = consolidatedTokens.filter(t => t.selected && !t.native && !t.permittable && new BigNumber(t.allowance).isLessThan(t.amount)).length

    const permitConsumption = 70000
    const transferConsumption = 40000 // higher avg

    const migrationTransactionsConsumption = (permitsCount + transfersCount > 0) ? 25000 + permitsCount * permitConsumption + transfersCount * transferConsumption : 0
    const signerTransactionsConsumption = (approvalCounts * (20000 + 21000)) + (21000 * !!consolidatedTokens.filter(t => t.selected && t.native).length)

    const nativeRate = gasData.gasFeeAssets.native / 10 ** 18 // should decimals be returned in the API?

    const gasFees = {}
    GAS_SPEEDS.forEach(speed => {
      let gasPrice = (gasData.gasPrice[speed] + (gasData.gasPrice.maxPriorityFeePerGas ? gasData.gasPrice.maxPriorityFeePerGas[speed] * 1 : 0))

      const migrationTransactionsCost = migrationTransactionsConsumption * gasPrice
      const migrationTransactionsCostUSD = migrationTransactionsCost * nativeRate

      const signerTransactionsCost = signerTransactionsConsumption * gasPrice
      const signerTransactionsCostUSD = signerTransactionsCost * nativeRate

      gasFees[speed] = {
        speed,
        migrationTransactionsCost,
        migrationTransactionsCostUSD,
        signerTransactionsCost,
        signerTransactionsCostUSD,
      }
    })

    setEstimatedGasFees({
      permitsCount,
      transfersCount,
      approvalCounts,
      nativeTransfersCount,
      gasFees,
    })

    const possibleFeeTokens = [
      ZERO_ADDRESS,
      ...gasData.gasFeeAssets.feeTokens.map(ft => ft.address)
    ]

    // includes existing tokens in identity portfolio + selected signer tokens, then filters by feeTokens
    let usableTokens = consolidatedTokens.filter(t => {
      return possibleFeeTokens.find(ft => ft.toLowerCase() === t.address.toLowerCase())
    })

    portfolio.tokens.forEach(pt => {
      if (
        // add to usableTokens, if token is present in the existing portfolio
        possibleFeeTokens.find(ft => ft.toLowerCase() === pt.address.toLowerCase()) &&
        // and if portfolio token is not already present
        !usableTokens.find(t => t.address.toLowerCase() === pt.address.toLowerCase())) {
        usableTokens.push({ ...pt, fromPortfolio: true }) // fromPortfolio = exists in portfolio but NOT in signer tokens
      }
    })

    const usableFeeTokens = usableTokens
      .map(t => {
        let identityBalanceUSD = 0
        let selectedAmountUSD = 0
        if (t.fromPortfolio) {// if exists in portfolio only
          identityBalanceUSD = t.balanceUSD
        } else {
          const identityAssets = portfolio?.tokens
          if (identityAssets) {
            const identityFeeAsset = identityAssets.find(it => it.address.toLowerCase() === t.address.toLowerCase())
            identityBalanceUSD = identityFeeAsset?.balanceUSD || 0
          } else {
            console.warn('no identity assets!')
          }
          selectedAmountUSD = new BigNumber(t.amount).multipliedBy(t.rate).toNumber()
        }

        let isEnoughToCoverFees = {}

        const selected = (!t.fromPortfolio && t.selected) || false

        GAS_SPEEDS.forEach(speed => {
          isEnoughToCoverFees[speed] = {
            ifNotSelected: new BigNumber(identityBalanceUSD).isGreaterThan(gasFees[speed].migrationTransactionsCostUSD),
            ifSelected: new BigNumber(identityBalanceUSD + selectedAmountUSD).isGreaterThan(gasFees[speed].migrationTransactionsCostUSD),
            minimumSelectionAmount: t.rate > 0 ? new BigNumber(gasFees[speed].migrationTransactionsCostUSD).minus(identityBalanceUSD).dividedBy(t.rate).dividedBy(10 ** t.decimals).multipliedBy(1.0001).toNumber() : 0, // in case rate returned is 0 / adding some wei because precision loss with decimals switching to USD etc
          }
        })

        return {
          address: t.address,
          name: t.name,
          selected: selected,
          identityBalanceUSD,
          selectedAmountUSD,
          isEnoughToCoverFees,
        }
      })
    setSuggestedGasTokens(usableFeeTokens)

  }, [selectableTokens, selectableTokensUserInputs, portfolio, gasData, selectedGasSpeed, tokensAllowances])


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

            let permittableData = false
            if (PERMITTABLE_COINS[network.chainId]) {
              permittableData = PERMITTABLE_COINS[network.chainId].find(p => p.address.toLowerCase() === t.address.toLowerCase()) || false
            }

            return {
              address: t.address,
              allowance: allowance.toString(),
              permittable: permittableData
            }
          }).catch(err => {
            console.log('err getting allowance', err)
          })
      }
      return {
        address: t.address,
        allowance: 0,
        permittable: false
      }
    })

    Promise.all(promises).then(allowanceResults => {
      setTokenAllowances(allowanceResults)
    })

  }, [identityAccount, network, selectableTokens, signerAccount])


  useEffect(() => {
    setModalButtons(
      <>
        <Button clear small icon={<MdClose/>} onClick={hideModal}>Close</Button>
        {
          (selectableTokensUserInputs.filter(a => a.selected).length > 0 && canCoverGasFees(suggestedGasTokens, selectedGasSpeed))
            ? <Button small icon={<MdOutlineNavigateNext/>} className={'primary'}
                      onClick={() => confirmTokenSelection()}>Migrate {selectableTokensUserInputs.filter(a => a.selected).length} assets</Button>
            : <Button small icon={<MdOutlineNavigateNext/>} className={'primary disabled'}>Migrate</Button>
        }
      </>
    )
  }, [selectableTokensUserInputs, suggestedGasTokens, selectedGasSpeed, setModalButtons, hideModal, confirmTokenSelection])

  return (
    <div id='assets-migration'>
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
                              className={'migrate-amount-input'}
                              value={item.humanAmount}
                              onChange={(val) => updateSelectableTokenUserInputs(item.address, (old) => {
                                if (val === '') {
                                  return {
                                    ...old,
                                    humanAmount: 0,
                                    amount: 0
                                  }
                                }
                                if (
                                  (val.endsWith('.') && val.split('.').length === 2)
                                  || (val.split('.').length === 2 && val.endsWith('0'))
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
                              })}
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
                    !canCoverGasFees(suggestedGasTokens, selectedGasSpeed) && selectableTokensUserInputs.filter(a => a.selected).length > 0 &&
                    <div className={'notification-hollow warning mt-3 mb-3'}>
                      The identity wallet will not have enough fees to pay for the migration transaction.
                      {
                        !!getSuggestedGasTokensOfSpeed(suggestedGasTokens, selectedGasSpeed).length &&
                        <div className={'mt-3'}>
                          You should remove ERC20 tokens from the selection or add one of the following gas tokens :
                          <ul class={'notification-gas-tokens'}>
                            {getSuggestedGasTokensOfSpeed(suggestedGasTokens, selectedGasSpeed).map((t, index) => {
                              return <li key={index}>
                                <span className={'gas-token-suggestion'}
                                      onClick={() => toggleTokenSelection(t.address, t.minimumSelectionAmount)}>
                                  {t.name}
                                  <span
                                    className={'gas-token-amount'}> (min {t.minimumSelectionAmount.toFixed(6)})</span>
                                </span>
                              </li>
                            })}
                          </ul>
                        </div>
                      }
                      {
                        !!getSuggestedGasTokensAcceptableSpeeds(suggestedGasTokens).length &&
                        <div>
                          {!!getSuggestedGasTokensOfSpeed(suggestedGasTokens, selectedGasSpeed).length ? 'You can also' : 'Please'} select
                          a slower gas speed ({getSuggestedGasTokensAcceptableSpeeds(suggestedGasTokens).join(', ')}).
                        </div>
                      }
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
                            Migration fee
                            {
                              (!!estimatedGasFees.transfersCount || !!estimatedGasFees.permitsCount) &&
                              <span className={'migration-actions'}>
                                  (
                                {
                                  !!estimatedGasFees.transfersCount &&
                                  <span>{estimatedGasFees.transfersCount} transfer{estimatedGasFees.transfersCount > 1 && 's'}{!!estimatedGasFees.permitsCount && ', '}</span>
                                }
                                {
                                  !!estimatedGasFees.permitsCount &&
                                  <span>{estimatedGasFees.permitsCount} permit{estimatedGasFees.permitsCount > 1 && 's'}</span>
                                }
                                )
                                </span>
                            }
                          </td>
                          <td
                            className={'gas-estimation-details-amount'}>${estimatedGasFees.gasFees[selectedGasSpeed].migrationTransactionsCostUSD.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>
                            Signer fee
                            {
                              (!!!!estimatedGasFees.nativeTransfersCount || !!estimatedGasFees.approvalCounts) &&
                              <span className={'migration-actions'}>
                                  (
                                {
                                  !!estimatedGasFees.nativeTransfersCount &&
                                  <span>{estimatedGasFees.nativeTransfersCount} transfer{!!estimatedGasFees.approvalCounts && ', '}</span>
                                }
                                {
                                  !!estimatedGasFees.approvalCounts &&
                                  <span>{estimatedGasFees.approvalCounts} approvals</span>
                                }
                                )
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
