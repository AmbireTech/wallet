import { useCallback, useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'

import { ZERO_ADDRESS } from 'consts/specialAddresses'
import { ERC20PermittableInterface } from 'consts/permittableCoins'
import { fetchGet } from 'lib/fetch'
import { getWallet } from 'lib/getWallet'

import Button from 'components/common/Button/Button'
import Token from './Token/Token'

import styles from './AssetsMigrationPermitter.module.scss'

const AssetsMigrationPermitter = ({
  addRequest,
  identityAccount,
  signer,
  signerExtra,
  network,
  selectedTokensWithAllowance,
  setError,
  hideModal,
  setStep,
  setModalButtons,
  relayerURL,
  gasSpeed,
  hidden
}) => {
  // storing user sign/send or rejection
  const [tokensPermissions, setTokensPermissions] = useState([])

  // storing transfer status for non permittable tokens
  const [tokensTransfers, setTokensTransfers] = useState({})

  // to be able to have UI feedback without trigerring useEffects
  const [tokensPendingStatus, setTokensPendingStatus] = useState({})
  // error display logic if a user has rejected one or more MM popup
  const [hasRefusedOnce, setHasRefusedOnce] = useState(false)
  const [lastRefusalError, setLastRefusalError] = useState(null)

  const [hasCorrectAccountAndChainId, setHasCorrectAccountAndChainId] = useState(null)

  const [currentGasPrice, setCurrentGasPrice] = useState(null)

  const [wallet, setWallet] = useState(null)

  // using a callback would return not up to date data + would trigger useEffect prompt loop while we do not want that
  const getConsolidatedTokensPure = (
    selected,
    tokensPermissions = [],
    tokensTransfers = [],
    tokensPendingStatus = []
  ) => {
    return selected
      .filter((t) => t.address !== ZERO_ADDRESS)
      .map((t) => {
        const remapped = {
          ...t,
          signing: null,
          signature: null,
          sent: false,
          pending: false,
          allowance: 0
        }
        if (tokensPermissions[t.address]) {
          remapped.signing = tokensPermissions[t.address].signing
          remapped.signature = tokensPermissions[t.address].signature
        }

        if (tokensTransfers[t.address]) {
          remapped.sent = true
        }

        if (tokensPendingStatus[t.address]) {
          remapped.pending = true
        }

        return remapped
      })
  }

  const checkWalletConnection = useCallback(async () => {
    return wallet
      ?.isConnected(signer.address, network.chainId)
      .then((connected) => {
        setHasCorrectAccountAndChainId(connected)
        if (!connected) {
          setError(
            <>
              Please make sure your signer wallet is unlocked, and connected with{' '}
              <b>{signer.address}</b> to the correct chain: <b>{network.id}</b>
            </>
          )
          return false
        }
        return true
      })
      .catch((e) => {
        setError(`Could not check signer connection status: ${e.error}`)
        return false
      })
  }, [network, setError, signer, wallet])

  // number of tokens that are ready to migrate (sent / permitted)
  const readyTokensCount = useCallback(() => {
    let count = 0
    getConsolidatedTokensPure(
      selectedTokensWithAllowance,
      tokensPermissions,
      tokensTransfers,
      []
    ).forEach((t) => {
      if (t.sent) {
        count++
      }
    })
    return count
  }, [selectedTokensWithAllowance, tokensPermissions, tokensTransfers])

  // Send MM prompt
  const sendToken = useCallback(
    async (address, waitForRcpt = false) => {
      if (!(await checkWalletConnection())) return

      const tokenToMigrate = selectedTokensWithAllowance.find((t) => t.address === address)
      if (!tokenToMigrate) return

      const sendData = ERC20PermittableInterface.encodeFunctionData('transfer', [
        identityAccount,
        new BigNumber(tokenToMigrate.amount).toFixed(0)
      ])

      // UI pending status
      setTokensPendingStatus((old) => {
        old[address] = true
        return { ...old }
      })

      setLastRefusalError(null)
      const transferResult = wallet
        .sendTransaction({
          from: signer.address,
          to: address,
          data: sendData,
          gasLimit: 110000,
          gasPrice: currentGasPrice,
          chainId: network.chainId
        })
        .then(async (rcpt) => {
          setTokensPermissions((old) => {
            old[address] = {
              ...old[address],
              signing: true
            }
            return { ...old }
          })

          if (waitForRcpt) {
            await rcpt.wait()
            setTokensTransfers((old) => {
              old[address] = true
              return { ...old }
            })

            setTokensPendingStatus((old) => {
              old[address] = false
              return { ...old }
            })

            setTokensPermissions((old) => {
              old[address] = {
                ...old[address],
                signing: false
              }
              return { ...old }
            })
          }

          return true
        })
        .catch((err) => {
          setTokensPendingStatus((old) => {
            old[address] = false
            return { ...old }
          })

          if (err.message.includes('underpriced')) {
            // not copying the whole JSON error returned by the rpc
            setLastRefusalError('Transaction fee underpriced')
          } else {
            setLastRefusalError(err.message)
          }

          setHasRefusedOnce(true)

          if (
            !tokensPermissions[address] ||
            (tokensPermissions[address] && tokensPermissions[address].signing !== false)
          ) {
            setTokensPermissions((old) => {
              old[address] = {
                ...old[address],
                signing: false
              }
              return { ...old }
            })
          }
          return false
        })

      return !!transferResult
    },
    [
      wallet,
      identityAccount,
      tokensPermissions,
      selectedTokensWithAllowance,
      currentGasPrice,
      network,
      signer,
      checkWalletConnection
    ]
  )

  // going to assets selection
  const cancelMigration = useCallback(() => {
    setError(null)
    setTokensTransfers([])
    setTokensPermissions([])
    setHasRefusedOnce(false)
    setStep(0)
  }, [setError, setTokensPermissions, setTokensTransfers, setStep])

  // batch transactions
  const completeMigration = useCallback(() => {
    // reset assets migration status
    cancelMigration()
    hideModal()
  }, [cancelMigration, hideModal])

  useEffect(() => {
    setWallet(
      getWallet({
        signer,
        signerExtra,
        chainId: network.chainId
      })
    )
  }, [network, signer, signerExtra])

  // check correctness of signer wallet before starting the chained popups
  useEffect(() => {
    checkWalletConnection()
  }, [checkWalletConnection])

  useEffect(() => {
    const url = `${relayerURL}/gasPrice/${network.id}`

    fetchGet(url)
      .then((gasData) => {
        let gasPrice = gasData.data.gasPrice[gasSpeed]
        if (gasData.data.gasPrice.maxPriorityFeePerGas) {
          gasPrice += gasData.data.gasPrice.maxPriorityFeePerGas[gasSpeed]
        }
        setCurrentGasPrice(gasPrice)
      })
      .catch((err) => {
        setError(`${err.message} ${url}`)
      })
  }, [network, relayerURL, setError, gasSpeed])

  // Automatic permit ask chain
  useEffect(() => {
    // Skip initial useEffect
    if (!hasCorrectAccountAndChainId) return
    if (!Object.values(tokensTransfers).length) return
    if (!currentGasPrice) return

    const tokensWithPermission = getConsolidatedTokensPure(
      selectedTokensWithAllowance,
      tokensPermissions,
      tokensTransfers,
      []
    ).map((t) => {
      return {
        address: t.address,
        signed: t.signing
      }
    })

    const nextTokenToAsk = tokensWithPermission.find((a) => a.signed === null)

    if (nextTokenToAsk) {
      // avoid MM popup losing focus when immediately running the next action
      setTimeout(() => {
        sendToken(nextTokenToAsk.address, true)
      }, 150)
    }
  }, [
    selectedTokensWithAllowance,
    sendToken,
    tokensPermissions,
    tokensTransfers,
    hasCorrectAccountAndChainId,
    currentGasPrice
  ])

  useEffect(() => {
    if (!selectedTokensWithAllowance.length) return
    const initialTokensTransfers = {}
    selectedTokensWithAllowance.forEach((t) => {
      initialTokensTransfers[t.address] = false
    })
    setTokensTransfers(initialTokensTransfers)
  }, [selectedTokensWithAllowance, setTokensTransfers])

  useEffect(() => {
    if (hasRefusedOnce) {
      setError(
        `Every asset below needs to be sent to complete the migration${
          lastRefusalError ? ` (${lastRefusalError})` : ''
        }`
      )
    }
  }, [hasRefusedOnce, setError, lastRefusalError])

  // Clearing UI error if all the tokens are validated
  useEffect(() => {
    if (readyTokensCount() === selectedTokensWithAllowance.length) {
      setError(null)
    }
  }, [readyTokensCount, selectedTokensWithAllowance, setError])

  useEffect(() => {
    if (hidden) return
    setModalButtons(
      <>
        <Button variant="secondary" onClick={() => cancelMigration()}>
          Back
        </Button>
        {readyTokensCount() === getConsolidatedTokensPure(selectedTokensWithAllowance).length ? (
          <Button onClick={() => hideModal()}>Close</Button>
        ) : (
          <Button variant="primaryGradient" disabled>
            Complete
          </Button>
        )}
      </>
    )
  }, [
    cancelMigration,
    completeMigration,
    readyTokensCount,
    selectedTokensWithAllowance,
    setModalButtons,
    hidden,
    hideModal
  ])

  if (hidden) return <></>

  return (
    <div className={styles.wrapper}>
      {readyTokensCount() < getConsolidatedTokensPure(selectedTokensWithAllowance).length ? (
        <div className={styles.actionsLeft}>{`${
          getConsolidatedTokensPure(selectedTokensWithAllowance).length - readyTokensCount()
        } actions left to complete the migration`}</div>
      ) : (
        <div className="notification-hollow mb-3 success">
          Your tokens were migrated. You can close this window
        </div>
      )}
      {getConsolidatedTokensPure(
        selectedTokensWithAllowance,
        tokensPermissions,
        tokensTransfers,
        tokensPendingStatus
      ).map((item, index) => (
        <Token
          data={item}
          sendToken={sendToken}
          key={index}
          isSendDisabled={!hasCorrectAccountAndChainId}
        />
      ))}
    </div>
  )
}

export default AssetsMigrationPermitter
