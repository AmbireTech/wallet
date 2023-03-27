import { useCallback, useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import cn from 'classnames'

import { getWallet } from 'lib/getWallet'

import { Button, Loading } from 'components/common'
import { GiToken } from 'react-icons/gi'
import Summary from './Summary/Summary'

import styles from './AssetsMigrationNative.module.scss'

const AssetsMigrationNative = ({
  identityAccount,
  signer,
  signerExtra,
  network,
  nativeTokenData,
  setSelectedTokensWithAllowance,
  selectedTokensWithAllowance,
  setError,
  setStep,
  hasERC20Tokens,
  hideModal,
  relayerURL,
  setModalButtons,
  setBeforeCloseModalHandler,
  gasSpeed,
  hidden
}) => {
  const [failedImg, setFailedImg] = useState([])
  const [hasMigratedNative, setHasMigratedNative] = useState(false)
  const [isMigrationPending, setIsMigrationPending] = useState(false)
  const [nativeAmount, setNativeAmount] = useState('0')
  const [currentGasPrice, setCurrentGasPrice] = useState(null)

  let wallet
  try {
    wallet = getWallet({
      signer,
      signerExtra,
      chainId: network.chainId
    })
  } catch (err) {
    // in case of no window.ethereum was injected from extension
    setError('No Web3 wallet connected. Please connect a Web3 wallet and reload the page')
  }

  // going back to assets selection
  const cancelMigration = useCallback(() => {
    setStep(0)
    setSelectedTokensWithAllowance([])
  }, [setSelectedTokensWithAllowance, setStep])

  const continueMigration = useCallback(() => {
    setStep(2)
  }, [setStep])

  // Pops MM modal to send native to Identity
  const migrateNative = useCallback(async () => {
    if (!wallet) return
    setError(null)
    setIsMigrationPending(true)

    if (!hasERC20Tokens) {
      setBeforeCloseModalHandler(null)
    }

    const hasCorrectChainAndAccount = await wallet
      .isConnected(signer.address, network.chainId)
      .catch((e) => {
        setError(`Could not check signer connection status: ${e.error}`)
      })

    if (hasCorrectChainAndAccount) {
      wallet
        .sendTransaction({
          from: signer.address,
          to: identityAccount,
          gasLimit: 30000 + (network.id === 'arbitrum' ? 200000 : 0),
          gasPrice: currentGasPrice,
          value: `0x${new BigNumber(nativeAmount).toString(16)}`,
          chainId: network.chainId
        })
        .then(async (rcpt) => {
          await rcpt.wait()
          setHasMigratedNative(true)
          setIsMigrationPending(false)
          return true
        })
        .catch((err) => {
          setHasMigratedNative(false)
          setIsMigrationPending(false)

          if (err && err.message.includes('must provide an Ethereum address')) {
            setError(`Make sure your wallet is unlocked and connected with ${signer.address}.`)
          } else {
            setError(`Native asset migration failed: ${err.message}`)
          }

          return false
        })
    } else {
      setError(
        <>
          Please make sure your signer wallet is unlocked, and connected with{' '}
          <b>{signer.address}</b> to the correct chain: <b>{network.id}</b>
        </>
      )
      setIsMigrationPending(false)
    }
  }, [
    wallet,
    setError,
    hasERC20Tokens,
    network,
    setBeforeCloseModalHandler,
    signer,
    identityAccount,
    nativeAmount,
    currentGasPrice
  ])

  useEffect(() => {
    if (hidden) return
    const getDisplayedButtons = () => {
      const buttons = []
      if (hasMigratedNative) {
        if (hasERC20Tokens) {
          buttons.push(
            <Button
              primaryGradient
              className={styles.fullWidthBtn}
              onClick={() => continueMigration()}
            >
              Next
            </Button>
          )
        } else {
          buttons.push(
            <Button primaryGradient className={styles.fullWidthBtn} onClick={() => hideModal()}>
              Close
            </Button>
          )
        }
      } else if (!wallet) {
        // will have to restart the process anyway as web3.ethereum is not injected (not to confuse with not unlocked)
        buttons.push(
          <Button clear className={styles.fullWidthBtn} onClick={() => hideModal()}>
            Close
          </Button>
        )
      } else {
        buttons.push(
          <Button clear className={styles.fullWidthBtn} onClick={() => cancelMigration()} key="0">
            Back
          </Button>
        )

        if (isMigrationPending) {
          buttons.push(
            <Button
              primaryGradient
              disabled
              className={styles.fullWidthBtn}
              icon={<Loading />}
              key="1"
            >
              Moving {nativeTokenData.name}...
            </Button>
          )
        } else {
          buttons.push(
            <Button
              primaryGradient
              className={styles.fullWidthBtn}
              onClick={() => migrateNative()}
              key="1"
            >
              Move {nativeTokenData.name}
            </Button>
          )
        }
      }
      return buttons
    }

    setModalButtons(getDisplayedButtons())
  }, [
    hasMigratedNative,
    hasERC20Tokens,
    setModalButtons,
    hideModal,
    isMigrationPending,
    cancelMigration,
    migrateNative,
    continueMigration,
    wallet,
    nativeTokenData,
    hidden
  ])

  if (hidden) return null

  return (
    <div className={styles.wrapper}>
      {wallet && (
        <>
          <div className={styles.titleWrapper}>
            <div className={styles.assetIcon}>
              {/* @TODO Implement Image component */}
              {failedImg.includes(nativeTokenData.icon) ? (
                <GiToken size={64} />
              ) : (
                <img
                  src={nativeTokenData.icon}
                  draggable="false"
                  alt="Token Icon"
                  onError={(err) => {
                    setFailedImg((failed) => [...failed, nativeTokenData.icon])
                  }}
                />
              )}
            </div>
            <h3 className={styles.title}>
              Migrate native asset <span className={styles.asset}>{nativeTokenData.name}</span>
            </h3>
          </div>

          {hasMigratedNative ? (
            <div className={cn(styles.smallAssetNotification, styles.success)}>
              Migration of your {nativeTokenData.name} was successful
            </div>
          ) : (
            <Summary
              network={network}
              relayerURL={relayerURL}
              gasSpeed={gasSpeed}
              nativeTokenData={nativeTokenData}
              nativeAmount={nativeAmount}
              setNativeAmount={setNativeAmount}
              selectedTokensWithAllowance={selectedTokensWithAllowance}
              setCurrentGasPrice={setCurrentGasPrice}
              isMigrationPending={isMigrationPending}
              hasERC20Tokens={hasERC20Tokens}
              setError={setError}
            />
          )}
        </>
      )}
    </div>
  )
}

export default AssetsMigrationNative
