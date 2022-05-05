import './AssetsMigration.scss'
import { useEffect, useState } from 'react'
import AssetsMigrationSelector from './AssetsMigrationSelector'
import AssetsMigrationPermitter from './AssetsMigrationPermitter'
import AssetsMigrationNative from './AssetsMigrationNative'
import { PERMITTABLE_COINS } from 'consts/permittableCoins'
import { MdClose, MdOutlineNavigateBefore } from 'react-icons/md'
import { Button } from 'components/common'

const AssetsMigration = ({ addRequest, selectedAccount, accounts, network, hideModal, relayerURL, portfolio, setModalButtons, setModalSteps, setBeforeCloseModalHandler }) => {

  const [selectedTokensWithAllowance, setSelectedTokensWithAllowance] = useState([])
  const [nativeTokenData, setNativeTokenData] = useState(null)
  const [hasERC20Tokens, setHasERC20Tokens] = useState(false)

  const [isSelectionConfirmed, setIsSelectionConfirmed] = useState(false)
  const [step, setStep] = useState(0)
  const [stepperSteps, setStepperSteps] = useState([])
  const [error, setError] = useState(null)

  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)

  //to get signer
  const currentAccount = accounts.find(a => a.id === selectedAccount)

  //clear error and reset tokens
  useEffect(() => {
    if (step === 0) {
      setError(null)
      setSelectedTokensWithAllowance([])
      setNativeTokenData(null)
      setHasERC20Tokens(false)
      setBeforeCloseModalHandler(null)
    }
  }, [network, selectedAccount, step, setBeforeCloseModalHandler])

  useEffect(() => {
    if (isSelectionConfirmed) {
      setIsSelectionConfirmed(false)

      //the non permittable, promise wait all
      setNativeTokenData(selectedTokensWithAllowance.find(t => t.native))
      setHasERC20Tokens(!!selectedTokensWithAllowance.find(t => !t.native))
    }
  }, [isSelectionConfirmed, currentAccount, selectedTokensWithAllowance, network, selectedAccount])

  useEffect(() => {
    let stepIndex = step

    if (step > 0 && !nativeTokenData) {
      stepIndex -= 1
    }

    setModalSteps({
      steps: stepperSteps.map(s => ({ name: s })),
      stepIndex
    })
  }, [nativeTokenData, setModalSteps, step, stepperSteps])

  useEffect(() => {
    const beforeCloseHandle = () => {
      setShowCloseConfirmation(true)
      setModalButtons([
        (<Button
          icon={<MdOutlineNavigateBefore/>}
          className={'clear'}
          onClick={() => setShowCloseConfirmation(false)}
        >Back</Button>),
        (<Button
          icon={<MdClose/>}
          className={'danger'}
          onClick={() => hideModal()}
        >Close</Button>)
      ])
    }

    if (step > 0) {
      setBeforeCloseModalHandler(() => beforeCloseHandle)
    }
  }, [step, setBeforeCloseModalHandler, setModalButtons, hideModal, showCloseConfirmation])

  return (
    <div>
      {
        error && <div className={'mt-3 error'}>{error}</div>
      }
      <div id='assets-migration'>
        {
          showCloseConfirmation
            ?
              <div className='notification-hollow warning mt-4'>
                By closing this window, your progress will be lost. Are you sure you want to close this window?
              </div>
            :
          <>
            {
              step === 0 && <AssetsMigrationSelector
                signerAccount={currentAccount.signer.address}
                identityAccount={selectedAccount}
                network={network}
                PERMITTABLE_COINS={PERMITTABLE_COINS}
                setIsSelectionConfirmed={setIsSelectionConfirmed}
                setStep={setStep}
                portfolio={portfolio}
                relayerURL={relayerURL}
                setModalButtons={setModalButtons}
                hideModal={hideModal}
                setError={setError}
                setSelectedTokensWithAllowance={setSelectedTokensWithAllowance}
                setStepperSteps={setStepperSteps}
              />
            }
            {step === 1 && nativeTokenData &&
              <AssetsMigrationNative
                signer={currentAccount.signer}
                identityAccount={selectedAccount}
                network={network}
                addRequest={addRequest}
                signerExtra={currentAccount.signerExtra}
                setError={setError}
                nativeTokenData={nativeTokenData}
                hideModal={hideModal}
                setStep={setStep}
                relayerURL={relayerURL}
                hasERC20Tokens={hasERC20Tokens}
                setModalButtons={setModalButtons}
                setSelectedTokensWithAllowance={setSelectedTokensWithAllowance}
                setBeforeCloseModalHandler={setBeforeCloseModalHandler}
              />
            }
            {step === 2 &&
              <AssetsMigrationPermitter
                signer={currentAccount.signer}
                identityAccount={selectedAccount}
                network={network}
                addRequest={addRequest}
                PERMITTABLE_COINS={PERMITTABLE_COINS}
                signerExtra={currentAccount.signerExtra}
                setError={setError}
                selectedTokensWithAllowance={selectedTokensWithAllowance}
                hideModal={hideModal}
                setStep={setStep}
                setModalButtons={setModalButtons}
              />
            }
          </>

        }

      </div>
    </div>
  )
}

export default AssetsMigration
