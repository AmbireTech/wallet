import './AssetsMigration.scss'
import { useCallback, useEffect, useState } from 'react'
import { getWallet } from 'lib/getWallet'
import { TextInput, Button, Loading } from 'components/common'

import { GiToken } from 'react-icons/gi'
import BigNumber from 'bignumber.js'
import { fetchGet } from 'lib/fetch'
import { MdOutlineNavigateNext, MdClose, MdOutlineNavigateBefore } from 'react-icons/md'

const AssetsMigrationNative = ({
                                 identityAccount,
                                 signer,
                                 signerExtra,
                                 network,
                                 nativeTokenData,
                                 setSelectedTokensWithAllowance,
                                 setError,
                                 setStep,
                                 hasERC20Tokens,
                                 hideModal,
                                 relayerURL,
                                 setModalButtons,
                               }) => {

  const [failedImg, setFailedImg] = useState([])
  const [hasMigratedNative, setHasMigratedNative] = useState(false)
  const [isMigrationPending, setIsMigrationPending] = useState(false)
  const [nativeAmount, setNativeAmount] = useState('0')
  const [maxRecommendedAmount, setMaxRecommendedAmount] = useState('0')
  const [transactionEstimationCost, setTransactionEstimationCost] = useState('0')
  const [nativeHumanAmount, setNativeHumanAmount] = useState('0')

  const [hasModifiedAmount, setHasModifiedAmount] = useState(false)

  let wallet
  try {
    wallet = getWallet({
      signer: signer,
      signerExtra: signerExtra,
      chainId: network.chainId
    })
  } catch (err) {
    // in case of no window.ethereum was injected from extension
    setError('No Web3 wallet connected. Please connect a Web3 wallet and reload the page')
  }

  //going back to assets selection
  const cancelMigration = useCallback(() => {
    setStep(0)
    setSelectedTokensWithAllowance([])
  }, [setSelectedTokensWithAllowance, setStep])

  const continueMigration = useCallback(() => {
    setStep(2)
  }, [setStep])

  //Pops MM modal to send native to Identity
  const migrateNative = useCallback(() => {
    if (!wallet) return
    setError(null)
    setIsMigrationPending(true)
    wallet.sendTransaction({
      from: signer.address,
      to: identityAccount,
      gasLimit: 25000,
      value: '0x' + new BigNumber(nativeAmount).toString(16),
    }).then(async rcpt => {
        await rcpt.wait()
        setHasMigratedNative(true)
        setIsMigrationPending(false)
      return true
    }).catch(err => {
      setHasMigratedNative(false)
      setIsMigrationPending(false)

      if (err && err.message.includes('must provide an Ethereum address')) {
        setError(`Make sure your wallet is unlocked and connected with ${signer.address}.`)
      } else {
        setError('Native asset migration failed')
      }

      return false
    })
  }, [identityAccount, nativeAmount, setError, signer, wallet])

  const updateAmount = useCallback((amount) => {
    let newHumanAmount = new BigNumber(amount).dividedBy(10 ** nativeTokenData.decimals).toFixed(nativeTokenData.decimals).replace(/\.?0+$/g, '')

    setNativeHumanAmount(newHumanAmount)
    setNativeAmount(amount)
    setHasModifiedAmount(true)
  }, [nativeTokenData])

  useEffect(() => {
      const url = `${relayerURL}/gasPrice/${network.id}`

      fetchGet(url).then(gasData => {
        let gasPrice = gasData.data.gasPrice.fast
        if (gasData.data.gasPrice.maxPriorityFeePerGas) {
          gasPrice += gasData.data.gasPrice.maxPriorityFeePerGas.fast
        }
        const estimatedTransactionCost = gasPrice * 25000
        //setCurrentGasPrice(gasPrice)
        setTransactionEstimationCost(new BigNumber(estimatedTransactionCost.toFixed(0)).toFixed(0))
        setMaxRecommendedAmount(new BigNumber(nativeTokenData.availableBalance).minus(estimatedTransactionCost).toFixed(0))
      }).catch(err => {
        setError(err.message + ' ' + url)
      })

  }, [setTransactionEstimationCost, setMaxRecommendedAmount, nativeTokenData, network, relayerURL, setError])

  useEffect(() => {
    const initialHumanAmount = new BigNumber(nativeTokenData.amount).dividedBy(10 ** nativeTokenData.decimals).toFixed(nativeTokenData.decimals).replace(/\.?0+$/g, '')
    setNativeHumanAmount(initialHumanAmount)
    setNativeAmount(nativeTokenData.amount)
  }, [nativeTokenData])

  useEffect( () => {

    const getDisplayedButtons = () => {
      let buttons = []
      if (hasMigratedNative) {
        if (hasERC20Tokens) {
          buttons.push(<Button
            icon={<MdOutlineNavigateNext/>}
            className={'primary full'}
            onClick={() => continueMigration()}
          >Next</Button>)
        } else {
          buttons.push(<Button
            icon={<MdClose/>}
            className={'primary full'}
            onClick={() => hideModal()}
          >Close</Button>)
        }
      } else if (!wallet) { // will have to restart the process anyway as web3.ethereum is not injected (not to confuse with not unlocked)
        buttons.push(<Button
          icon={<MdClose/>}
          className={'clear full'}
          onClick={() => hideModal()}
        >Close</Button>)
      } else {
        buttons.push(<Button
          icon={<MdOutlineNavigateBefore/>}
          className={'clear'}
          onClick={() => cancelMigration()}
        >Back</Button>)

        if (isMigrationPending) {
          buttons.push(<Button
            icon={<Loading />}
            className={'primary disabled'}
          >Moving {nativeTokenData.name}...</Button>)
        } else {
          buttons.push(<Button
            icon={<MdOutlineNavigateNext/>}
            className={'primary'}
            onClick={() => migrateNative()}
          >Move {nativeTokenData.name}</Button>)
        }
      }
      return buttons
    }

    setModalButtons(getDisplayedButtons())
  }, [hasMigratedNative, hasERC20Tokens, setModalButtons, hideModal, isMigrationPending, cancelMigration, migrateNative, continueMigration, wallet, nativeTokenData])

  return (
    <div>

      {
        wallet &&
        <>
          <div className={'migration-native-title mb-4'}>
            <div className='migration-native-asset-icon'>
              {
                failedImg.includes(nativeTokenData.icon) ?
                  <GiToken size={64}/>
                  :
                  <img src={nativeTokenData.icon} draggable="false" alt="Token Icon" onError={(err) => {
                    setFailedImg(failed => [...failed, nativeTokenData.icon])
                  }}/>
              }
            </div>
            <div className='migration-native-title-asset-name'>Migrate native asset <b>{nativeTokenData.name}</b></div>
          </div>

          {
            hasMigratedNative
              ?
              <>
                <div className={'small-asset-notification success'}>Migration of your {nativeTokenData.name} was successful</div>
              </>
              :
              <>
                <div className={'migration-native-row'}>
                  <span className={'migration-native-row-key'}>
                    Current balance
                  </span>
                  <span className={'migration-native-selection'} onClick={() => updateAmount(nativeTokenData.availableBalance)} >
                    {new BigNumber(nativeTokenData.availableBalance).dividedBy(10 ** nativeTokenData.decimals).toFixed(6)} {nativeTokenData.name}
                  </span>
                </div>

                <div className={'migration-native-row'}>
                  <span className={'migration-native-row-key'}>Amount to migrate</span>
                    {
                      (hasModifiedAmount || nativeAmount > maxRecommendedAmount)
                        ?
                        <TextInput
                          className={'migrate-amount-input'}
                          value={nativeHumanAmount}
                          onChange={(val) => {
                            setHasModifiedAmount(true)
                            if (val === '') {
                              setNativeHumanAmount(0)
                              setNativeAmount(0)
                              return
                            }
                            if (
                              (val.endsWith('.') && val.split('.').length === 2)
                              || (val.split('.').length === 2 && val.endsWith('0'))
                            ) {
                              setNativeHumanAmount(val)
                              return
                            }

                            if (!isNaN(val)) {
                              let newHumanAmount = new BigNumber(val).toFixed(nativeTokenData.decimals)
                              if (new BigNumber(newHumanAmount).multipliedBy(10 ** nativeTokenData.decimals).comparedTo(nativeTokenData.availableBalance) === 1) {
                                newHumanAmount = new BigNumber(nativeTokenData.availableBalance).dividedBy(10 ** nativeTokenData.decimals).toFixed(nativeTokenData.decimals)
                              }
                              //trim trailing . or 0
                              newHumanAmount = newHumanAmount.replace(/\.?0+$/g, '')

                              setNativeHumanAmount(newHumanAmount)
                              setNativeAmount(new BigNumber(newHumanAmount).multipliedBy(10 ** nativeTokenData.decimals).toFixed(0))
                            }
                          }}
                        />
                        :
                        <div>{ nativeHumanAmount }</div>
                    }
                </div>

                {
                  nativeAmount > maxRecommendedAmount &&
                  <div className={'notification-hollow warning mt-4'}>
                    <div>
                      Current Transaction cost : ~{new BigNumber(transactionEstimationCost).dividedBy(10 ** nativeTokenData.decimals).toFixed(6)} {nativeTokenData.name}
                      <span className={'migration-native-usd'}> (${new BigNumber(transactionEstimationCost).multipliedBy(nativeTokenData.rate).toFixed(2)})</span>
                    </div>

                    <div className={'mt-3 mb-3'}>
                      <span>According to the current gas prices, the maximum recommended to migrate is </span>
                      <span className={'migration-native-selection'} onClick={() => updateAmount(maxRecommendedAmount)}>
                        {new BigNumber(maxRecommendedAmount).dividedBy(10 ** nativeTokenData.decimals).toFixed(6)} {nativeTokenData.name}
                      </span>
                    </div>
                    <div>Sending more might not cover the gas fees</div>
                  </div>
                }

                {
                  (isMigrationPending && hasERC20Tokens) &&
                  <div className={'notification-hollow info mt-4'}>
                    Waiting for the transaction to be mined before continuing migration...
                  </div>
                }
                {
                  (isMigrationPending && !hasERC20Tokens) &&
                  <div className={'notification-hollow info mt-4'}>
                    The amount of {nativeTokenData.name} will be updated in your wallet, once the transaction has been confirmed and mined.
                    If you confirmed your transaction, you can already close this window
                  </div>
                }
              </>
          }
        </>
      }
    </div>
  )
}

export default AssetsMigrationNative
