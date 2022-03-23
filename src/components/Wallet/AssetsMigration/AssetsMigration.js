import './AssetsMigration.scss'
import { useEffect, useState } from 'react'
import { getProvider } from 'lib/provider'
import { Contract } from 'ethers'
import AssetsMigrationSelector from './AssetsMigrationSelector'
import AssetsMigrationPermitter from './AssetsMigrationPermitter'
import { PERMITTABLE_COINS, ERC20PermittableInterface } from 'consts/PermittableCoins'

const AssetsMigration = ({ addRequest, selectedAccount, accounts, network, hideModal }) => {

  const [selectedTokens, setSelectedTokens] = useState([])
  const [selectedTokensWithAllowance, setSelectedTokensWithAllowance] = useState([])
  const [isSelectionConfirmed, setIsSelectionConfirmed] = useState(false)
  const [error, setError] = useState(null)

  //to get signer
  const currentAccount = accounts.find(a => a.id === selectedAccount)

  //clear error and reset tokens
  useEffect(() => {
    setError(null)
    setSelectedTokens([])
    setSelectedTokensWithAllowance([])
  }, [network, selectedAccount, setSelectedTokens, setSelectedTokensWithAllowance])

  //reset tokensWithAllowance whenever selectedTokens is reset to 0
  useEffect(() => {
    if (!selectedTokens.length) {
      setSelectedTokensWithAllowance([])
    }
  }, [selectedTokens, setSelectedTokensWithAllowance])

  useEffect(() => {
    if (isSelectionConfirmed) {
      setIsSelectionConfirmed(false)

      //the non permittable, promise wait all
      const promises = []

      selectedTokens.forEach(t => {
        const provider = getProvider(network.id)
        const tokenContract = new Contract(t.address, ERC20PermittableInterface, provider)

        if (!t.permittable) {
          promises.push(
            tokenContract.allowance(currentAccount.signer.address, selectedAccount)
              .then((allowance) => {
                return {
                  address: t.address,
                  allowance: allowance.toString()
                }
              }).catch(err => {
              console.log('err getting allowance', err)
            })
          )
        }
      })

      Promise.all(promises).then(allowanceResults => {
        const tokensWithAllowances = [...selectedTokens.map(t => {
          const allowance = allowanceResults.find(a => a && a.address === t.address)//if a === undefined
          if (allowance) {
            return {
              ...t,
              allowance: allowance.allowance || 0
            }
          }
          return {
            ...t,
            allowance: 0
          }
        })]
        if (selectedTokens.length) {
          setSelectedTokensWithAllowance(tokensWithAllowances)
        }
      })
    }
  }, [isSelectionConfirmed, currentAccount, selectedTokens, network, selectedAccount])

  return (
    <div>
      {
        error && <div className={'mt-3 error'}>{error}</div>
      }
      <div id='assets-migration'>
        {
          !selectedTokens.length && <AssetsMigrationSelector
            signerAccount={currentAccount.signer.address}
            identityAccount={selectedAccount}
            setSelectedTokens={setSelectedTokens}
            network={network}
            PERMITTABLE_COINS={PERMITTABLE_COINS}
            setIsSelectionConfirmed={setIsSelectionConfirmed}
          />
        }
        {!!selectedTokensWithAllowance.length &&
          <AssetsMigrationPermitter
            signer={currentAccount.signer}
            identityAccount={selectedAccount}
            network={network}
            addRequest={addRequest}
            PERMITTABLE_COINS={PERMITTABLE_COINS}
            signerExtra={currentAccount.signerExtra}
            setError={setError}
            setSelectedTokens={setSelectedTokens}
            selectedTokensWithAllowance={selectedTokensWithAllowance}
            hideModal={hideModal}
          />
        }
      </div>
    </div>
  )
}

export default AssetsMigration
