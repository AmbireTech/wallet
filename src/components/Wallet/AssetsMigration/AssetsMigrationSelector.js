import './AssetsMigration.scss'

import BigNumber from 'bignumber.js'
import { useCallback, useEffect, useState } from 'react'
import assetMigrationDetector from 'lib/assetMigrationDetector'
import { PERMITTABLE_COINS } from 'consts/PermittableCoins'
import AmbireLoading from 'components/common/Loading/AmbireLoading'
import { Checkbox, TextInput, Button } from 'components/common'
import { GiToken } from 'react-icons/gi'

const AssetsMigrationSelector = ({ signerAccount, network, setSelectedTokens, setIsSelectionConfirmed }) => {

  const [selectableTokens, setSelectableTokens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [failedImg, setFailedImg] = useState([])

  //update signerTokens state helper
  const updateSelectableToken = useCallback((address, callback) => {
    const index = selectableTokens.findIndex(a => a.address === address)

    if (index !== -1) {
      const updated = callback(selectableTokens[index])

      setSelectableTokens([
        ...selectableTokens.slice(0, index),
        updated,
        ...selectableTokens.slice(index + 1),
      ])
    }
  }, [selectableTokens, setSelectableTokens])

  //Include/Exclude token in migration
  const toggleTokenSelection = (address) => {
    updateSelectableToken(address, old => {
      return {
        ...old,
        selected: !old.selected
      }
    })
  }

  //select tokens to migrate
  const confirmTokenSelection = useCallback(async () => {

    const tokensToMigrate = selectableTokens.filter(a => a.selected)
    if (!tokensToMigrate.length) return

    setSelectedTokens(tokensToMigrate.map(a => {
      let permittableData = null

      if (PERMITTABLE_COINS[network.chainId]) {
        permittableData = PERMITTABLE_COINS[network.chainId].find(p => p.address.toLowerCase() === a.address.toLowerCase())
      }

      return {
        ...a,
        signature: null,
        permittable: permittableData,
      }
    }))
    setIsSelectionConfirmed(true)

  }, [selectableTokens, setSelectedTokens, network, setIsSelectionConfirmed])


  //fetch selectable tokens
  useEffect(() => {

    setIsLoading(true)
    setSelectableTokens([])

    assetMigrationDetector({ networkId: network.id, account: signerAccount }).then(assets => {
      setSelectableTokens(
        assets.map(t => {
          return {
            ...t,
            selectedAmount: 0,
            amount: t.availableBalance,
            humanAmount: t.availableBalance / 10 ** t.decimals,
            selected: false
          }
        })
      )
      setIsLoading(false)
    }).catch(err => {
      console.error(err)
    })

  }, [signerAccount, setIsLoading, setSelectableTokens, network])

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
                : <div>
                  <div className={'mb-4'}>Please select the assets you would like to migrate from your signer wallet to
                    your Ambire wallet
                  </div>
                  {selectableTokens
                    .sort((a, b) => a.name < b.name ? -1 : 1)
                    .map((item, index) => (
                      <div className='migration-asset-row' key={index}>
                        <div className={`migration-asset-select${item.selected ? ' checked' : ''}`} onClick={() => false}>
                          <Checkbox
                            id={`check-${item.address}`}
                            label={<span className={'migration-asset-select-label'}>
                                <span className='migration-asset-select-icon'>
                                  {
                                    failedImg.includes(item.icon) ?
                                      <GiToken size={18}/>
                                      :
                                      <img src={item.icon} draggable="false" alt="Token Icon" onError={(err) => {
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
                            onChange={(val) => updateSelectableToken(item.address, (old) => {

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
                                //trim trailing . or 0
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
                    ))}

                  {selectableTokens.filter(a => a.selected).length > 0 && <Button className={'align-right mt-4 primary'}
                                                                                  onClick={() => confirmTokenSelection()}>Migrate {selectableTokens.filter(a => a.selected).length} assets</Button>}
                </div>
            }
          </div>
      }
    </div>
  )

}

export default AssetsMigrationSelector
