import { useEffect, useState } from 'react'

import { PERMITTABLE_COINS } from 'consts/permittableCoins'

import { Button } from 'components/common'
import AssetsMigrationSelector from './AssetsMigrationSelector/AssetsMigrationSelector'
import AssetsMigrationPermitter from './AssetsMigrationPermitter/AssetsMigrationPermitter'
import AssetsMigrationNative from './AssetsMigrationNative/AssetsMigrationNative'

import styles from './AssetsMigration.module.scss'

const AssetsMigration = ({
  addRequest,
  selectedAccount,
  accounts,
  network,
  hideModal,
  relayerURL,
  portfolio,
  setModalButtons,
  setModalSteps,
  setBeforeCloseModalHandler,
}) => {
  const [selectedTokensWithAllowance, setSelectedTokensWithAllowance] = useState([])
  const [nativeTokenData, setNativeTokenData] = useState(null)
  const [hasERC20Tokens, setHasERC20Tokens] = useState(false)

  const [isSelectionConfirmed, setIsSelectionConfirmed] = useState(false)
  const [step, setStep] = useState(0)
  const [stepperSteps, setStepperSteps] = useState([])
  const [error, setError] = useState(null)

  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)

  const [gasSpeed, setGasSpeed] = useState(null)

  //to get signer
  const currentAccount = accounts.find((a) => a.id === selectedAccount)

  //clear error and reset tokens
  useEffect(() => {
    if (step === 0) {
      setError(null)
      setSelectedTokensWithAllowance([])
      setNativeTokenData(null)
      setHasERC20Tokens(false)
      setGasSpeed(null)
      setBeforeCloseModalHandler(null)
    }
  }, [network, selectedAccount, step, setBeforeCloseModalHandler])

  useEffect(() => {
    if (isSelectionConfirmed) {
      setIsSelectionConfirmed(false)

      //the non permittable, promise wait all
      setNativeTokenData(selectedTokensWithAllowance.find((t) => t.native))
      setHasERC20Tokens(!!selectedTokensWithAllowance.find((t) => !t.native))
    }
  }, [isSelectionConfirmed, currentAccount, selectedTokensWithAllowance, network, selectedAccount])

  useEffect(() => {
    let stepIndex = step

    if (step > 0 && !nativeTokenData) {
      stepIndex -= 1
    }

    setModalSteps({
      steps: stepperSteps.map((s) => ({ name: s })),
      stepIndex,
    })
  }, [nativeTokenData, setModalSteps, step, stepperSteps])

  useEffect(() => {
    const beforeCloseHandle = () => {
      setShowCloseConfirmation(true)
      setModalButtons([
        <Button
          variant="secondary"
          onClick={() => setShowCloseConfirmation(false)}
          key="0"
          className={styles.button}
        >
          Back
        </Button>,
        <Button variant="danger" onClick={() => hideModal()} key="1" className={styles.button}>
          Close
        </Button>,
      ])
    }

    if (step > 0) {
      setBeforeCloseModalHandler(() => beforeCloseHandle)
    }
  }, [step, setBeforeCloseModalHandler, setModalButtons, hideModal, showCloseConfirmation])

  return (
    <div>
      {error && <div className={styles.error}>{error}</div>}
      <div>
        {showCloseConfirmation && (
          <div className="notification-hollow warning mt-4">
            By closing this window, your progress will be lost. Are you sure you want to close this window?
          </div>
        )}
        {step === 0 && (
          <AssetsMigrationSelector
            hidden={showCloseConfirmation}
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
            setGasSpeed={setGasSpeed}
          />
        )}
        {step === 1 && nativeTokenData && (
          <AssetsMigrationNative
            hidden={showCloseConfirmation}
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
            selectedTokensWithAllowance={selectedTokensWithAllowance}
            setBeforeCloseModalHandler={setBeforeCloseModalHandler}
            gasSpeed={gasSpeed}
          />
        )}
        {step === 2 && (
          <AssetsMigrationPermitter
            hidden={showCloseConfirmation}
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
            gasSpeed={gasSpeed}
            relayerURL={relayerURL}
          />
        )}
      </div>
    </div>
  )
}

export default AssetsMigration
