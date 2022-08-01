import './AssetsMigration.scss'
import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { getWallet } from 'lib/getWallet'
import { getProvider } from 'lib/provider'
import { Contract } from 'ethers'
import { FaCheck, FaHourglass } from 'react-icons/fa'
import Button from 'components/common/Button/Button'

import {
  PERMITTABLE_COINS,
  PERMIT_TYPE_DAI,
  ERC20PermittableInterface,
  EIP712DomainWithSalt
} from 'consts/permittableCoins'
import { GiToken } from 'react-icons/gi'
import { MdOutlineNavigateBefore, MdOutlineNavigateNext } from 'react-icons/md'
import { ZERO_ADDRESS } from 'consts/specialAddresses'
import { fetchGet } from 'lib/fetch'
import BigNumber from 'bignumber.js'

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

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
                                    hidden,
                                  }) => {

  //storing user sign/send or rejection
  const [tokensPermissions, setTokensPermissions] = useState([])

  //storing transfer status for non permittable tokens
  const [tokensTransfers, setTokensTransfers] = useState({})

  //to be able to have UI feedback without trigerring useEffects
  const [tokensPendingStatus, setTokensPendingStatus] = useState({})
  //error display logic if a user has rejected one or more MM popup
  const [hasRefusedOnce, setHasRefusedOnce] = useState(false)
  const [lastRefusalError, setLastRefusalError] = useState(null)
  const [failedImg, setFailedImg] = useState([])

  const [hasCorrectAccountAndChainId, setHasCorrectAccountAndChainId] = useState(null)

  const [currentGasPrice, setCurrentGasPrice] = useState(null)

  const [wallet, setWallet] = useState(null)

  //using a callback would return not up to date data + would trigger useEffect prompt loop while we do not want that
  const getConsolidatedTokensPure = (selected, tokensPermissions = [], tokensTransfers = [], tokensPendingStatus = []) => {
    return selected.filter(t => t.address !== ZERO_ADDRESS).map(t => {
      let remapped = {
        ...t,
        signing: null,
        signature: null,
        sent: false,
        pending: false,
        allowance: 0,
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
    return wallet?.isConnected(signer.address, network.chainId)
      .then(connected => {
        setHasCorrectAccountAndChainId(connected)
        if (!connected) {
          setError(<>Please make sure your signer wallet is unlocked, and connected with <b>{signer.address}</b> to the correct chain: <b>{network.id}</b></>)
          return false
        }
        return true
      })
      .catch(e => {
        setError('Could not check signer connection status: ' + e.error)
        return false
      })
  }, [network, setError, signer, wallet])

  //number of tokens that are ready to migrate (sent / permitted)
  const readyTokensCount = useCallback(() => {
    let count = 0
    getConsolidatedTokensPure(selectedTokensWithAllowance, tokensPermissions, tokensTransfers, []).forEach(t => {
      if (t.permittable && t.signature) {
        count++
      } else if (t.sent) {
        count++
      }
    })
    return count
  }, [selectedTokensWithAllowance, tokensPermissions, tokensTransfers])


  //Offline signing MM prompt
  const permitToken = useCallback(async (address) => {
    const permittableToken = PERMITTABLE_COINS[network.chainId].find(a => a.address.toLowerCase() === address.toLowerCase())
    if (permittableToken) {

      const index = selectedTokensWithAllowance.findIndex(a => a.address === address)

      if (index !== -1) {

        const tokenToMigrate = selectedTokensWithAllowance[index]

        //get ERC20 permittable nonce
        const provider = getProvider(network.id)
        const tokenContract = new Contract(address, ERC20PermittableInterface, provider)


        const nonce = (await (
          permittableToken.nonceFunction
            ? tokenContract[permittableToken.nonceFunction](signer.address)
            : tokenContract.nonces(signer.address)
        )).toString()

        //and name, for domain
        const tokenName = await tokenContract.name()

        //the quantity to permit
        const value = tokenToMigrate.amount

        let ERC2612PermitMessage = {
          owner: signer.address,
          spender: identityAccount,
          value,
          nonce: nonce,
          deadline: MAX_INT,
        }

        //DAI reformatting
        if (permittableToken.permitType === PERMIT_TYPE_DAI) {
          ERC2612PermitMessage.allowed = true
          delete ERC2612PermitMessage.value

          ERC2612PermitMessage.holder = ERC2612PermitMessage.owner
          delete ERC2612PermitMessage.owner

          ERC2612PermitMessage.expiry = ERC2612PermitMessage.deadline
          delete ERC2612PermitMessage.deadline
        }

        let domain = {
          chainId: network.chainId,
          verifyingContract: address,
        }

        if (permittableToken.name) {
          domain.name = tokenName
        }

        if (permittableToken.version) {
          domain.version = permittableToken.version
        }

        if (permittableToken.salt) {
          domain.salt = permittableToken.salt
        }

        if (permittableToken.domainType === EIP712DomainWithSalt) {
          delete domain.chainId
        }

        //UI pending status
        setTokensPendingStatus(old => {
          old[address] = true
          return { ...old }
        })

        //sign
        const result = await wallet._signTypedData(domain, { 'Permit': permittableToken.permitType }, ERC2612PermitMessage)
          .catch(err => {
            if (err?.code === 4001) {//User rejection
              setTokensPermissions(old => {
                old[address] = {
                  ...old[address],
                  signing: false,
                  signature: null
                }
                return { ...old }
              })
              setHasRefusedOnce(true)
            } else if (err?.code === -32603) {//bad network
              if (err.message.includes('Not supported on this device')) {
                setError('Your signer wallet does not support 712 signatures')
              } else if (err.message.includes('must match the active chainId')) {
                setError('Please connect your signser wallet to the correct network: ' + network.id)
              } else {
                setError(err.message)
              }
            } else {
              setError(err.message)
            }
            setTokensPendingStatus(old => {
              old[address] = false
              return { ...old }
            })
          })

        if (!result) return false

        const rsv = {
          r: result.slice(0, 66),
          s: '0x' + result.slice(66, 130),
          v: parseInt(result.slice(130, 132), 16),
        }

        let txData
        if (permittableToken.permitType === PERMIT_TYPE_DAI) {
          txData = ERC20PermittableInterface.encodeFunctionData('permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s)', [
            ERC2612PermitMessage.holder,
            ERC2612PermitMessage.spender,
            nonce,
            ERC2612PermitMessage.expiry,
            ERC2612PermitMessage.allowed,
            rsv.v,
            rsv.r,
            rsv.s,
          ])
        } else {
          txData = ERC20PermittableInterface.encodeFunctionData('permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)', [
            ERC2612PermitMessage.owner,
            ERC2612PermitMessage.spender,
            value,
            ERC2612PermitMessage.deadline,
            rsv.v,
            rsv.r,
            rsv.s,
          ])
        }

        //saving permit hexData for later transaction building
        setTokensPermissions(old => {
          old[address] = {
            ...old[address],
            signing: true,
            signature: txData
          }
          return { ...old }
        })

        setTokensPendingStatus(old => {
          old[address] = false
          return { ...old }
        })

        return true
      }//end if index found
    }//end if is permittable
  }, [network, selectedTokensWithAllowance, signer, identityAccount, setError, wallet])

  //Send MM prompt
  const sendToken = useCallback(async (address, waitForRcpt = false) => {

    if (!(await checkWalletConnection())) return

    const tokenToMigrate = selectedTokensWithAllowance.find(t => t.address === address)
    if (!tokenToMigrate) return

    const sendData = ERC20PermittableInterface.encodeFunctionData('transfer', [identityAccount, new BigNumber(tokenToMigrate.amount).toFixed(0)])

    //UI pending status
    setTokensPendingStatus(old => {
      old[address] = true
      return { ...old }
    })

    setLastRefusalError(null)
    const transferResult = wallet.sendTransaction({
      from: signer.address,
      to: address,
      data: sendData,
      gasLimit: 80000,
      gasPrice: currentGasPrice,
      chainId: network.chainId,
    }).then(async rcpt => {

      setTokensPermissions(old => {
        old[address] = {
          ...old[address],
          signing: true,
        }
        return { ...old }
      })

      if (waitForRcpt) {
        await rcpt.wait()
        setTokensTransfers(old => {
          old[address] = true
          return { ...old }
        })

        setTokensPendingStatus(old => {
          old[address] = false
          return { ...old }
        })

        setTokensPermissions(old => {
          old[address] = {
            ...old[address],
            signing: false,
          }
          return { ...old }
        })
      }

      return true
    }).catch(err => {
      setTokensPendingStatus(old => {
        old[address] = false
        return { ...old }
      })

      if (err.message.includes('underpriced')) { // not copying the whole JSON error returned by the rpc
        setLastRefusalError('Transaction fee underpriced')
      } else {
        setLastRefusalError(err.message)
      }

      setHasRefusedOnce(true)

      if (!tokensPermissions[address] || (tokensPermissions[address] && tokensPermissions[address].signing !== false)) {
        setTokensPermissions(old => {
          old[address] = {
            ...old[address],
            signing: false,
          }
          return { ...old }
        })
      }
      return false
    })

    return !!transferResult

  }, [wallet, identityAccount, tokensPermissions, selectedTokensWithAllowance, currentGasPrice, network, signer, checkWalletConnection])

  //going to assets selection
  const cancelMigration = useCallback(() => {
    setError(null)
    setTokensTransfers([])
    setTokensPermissions([])
    setHasRefusedOnce(false)
    setStep(0)
  }, [setError, setTokensPermissions, setTokensTransfers, setStep])

  //batch transactions
  const completeMigration = useCallback(() => {

    getConsolidatedTokensPure(selectedTokensWithAllowance, tokensPermissions, tokensTransfers, tokensPendingStatus).forEach(t => {

      if (!t.permittable) return

      if (!(t.allowance && ethers.BigNumber.from(t.allowance).gte(t.amount))) {
        addRequest({
          id: 'req-' + Math.random(),
          chainId: network.chainId,
          account: identityAccount,
          type: 'eth_sendTransaction',
          txn: {
            to: t.address,
            value: '0x0',
            data: t.signature
          }
        })
      }

      const transferData = ERC20PermittableInterface.encodeFunctionData('transferFrom', [
        signer.address,
        identityAccount,
        t.amount
      ])

      addRequest({
        id: 'req-' + Math.random(),
        chainId: network.chainId,
        account: identityAccount,
        type: 'eth_sendTransaction',
        txn: {
          to: t.address,
          value: '0x0',
          data: transferData
        }
      })
    })

    //reset assets migration status
    cancelMigration()
    hideModal()
  }, [addRequest, cancelMigration, hideModal, identityAccount, network, selectedTokensWithAllowance, signer, tokensTransfers, tokensPendingStatus, tokensPermissions])

  useEffect(() => {
    setWallet(getWallet({
      signer: signer,
      signerExtra: signerExtra,
      chainId: network.chainId
    }))
  }, [network, signer, signerExtra])

  // check correctness of signer wallet before starting the chained popups
  useEffect(() => {
    checkWalletConnection()
  }, [checkWalletConnection])

  useEffect(() => {
    const url = `${relayerURL}/gasPrice/${network.id}`

    fetchGet(url).then(gasData => {
      let gasPrice = gasData.data.gasPrice[gasSpeed]
      if (gasData.data.gasPrice.maxPriorityFeePerGas) {
        gasPrice += gasData.data.gasPrice.maxPriorityFeePerGas[gasSpeed]
      }
      setCurrentGasPrice(gasPrice)
    }).catch(err => {
      setError(err.message + ' ' + url)
    })

  }, [network, relayerURL, setError, gasSpeed])

  //Automatic permit ask chain
  useEffect(() => {

    //Skip initial useEffect
    if (!hasCorrectAccountAndChainId) return
    if (!Object.values(tokensTransfers).length) return
    if (!currentGasPrice) return

    const tokensWithPermission = getConsolidatedTokensPure(selectedTokensWithAllowance, tokensPermissions, tokensTransfers, []).map(t => {
      return {
        address: t.address,
        signed: t.signing,
        permittable: t.permittable
      }
    })

    const nextTokenToAsk = tokensWithPermission.find(a => a.signed === null)

    if (nextTokenToAsk) {
      if (nextTokenToAsk.permittable) {
        permitToken(nextTokenToAsk.address)
      } else {
        //avoid MM popup losing focus when immediately running the next action
        setTimeout(() => {
          sendToken(nextTokenToAsk.address, true)
        }, 150)
      }
    }
  }, [selectedTokensWithAllowance, permitToken, sendToken, tokensPermissions, tokensTransfers, hasCorrectAccountAndChainId, currentGasPrice])

  useEffect(() => {
    if (!selectedTokensWithAllowance.length) return
    const initialTokensTransfers = {}
    selectedTokensWithAllowance.forEach(t => {
      initialTokensTransfers[t.address] = false
    })
    setTokensTransfers(initialTokensTransfers)
  }, [selectedTokensWithAllowance, setTokensTransfers])

  useEffect(() => {
    if (hasRefusedOnce) {
      setError('Every asset below needs to be sent or permitted to complete the migration' + (lastRefusalError ? ' (' + lastRefusalError + ')' : ''))
    }
  }, [hasRefusedOnce, setError, lastRefusalError])


  //Clearing UI error if all the tokens are validated
  useEffect(() => {
    if (readyTokensCount() === selectedTokensWithAllowance.length) {
      setError(null)
    }
  }, [readyTokensCount, selectedTokensWithAllowance, setError])

  useEffect(() => {
    if (hidden) return
    setModalButtons(
      <>
        <Button
          className={'clear'}
          icon={<MdOutlineNavigateBefore/>}
          onClick={() => cancelMigration()}
        >Back</Button>
        {
          selectedTokensWithAllowance.find(t => t.permittable)
            ? (
              readyTokensCount() === getConsolidatedTokensPure(selectedTokensWithAllowance).length
                ?
                <Button
                  className={'primary'}
                  icon={<MdOutlineNavigateNext/>}
                  onClick={() => completeMigration()}
                >Move tokens</Button>
                :
                <Button
                  className={'primary disabled'}
                  icon={<MdOutlineNavigateNext/>}
                >Move tokens</Button>
            )
            : (
              readyTokensCount() === getConsolidatedTokensPure(selectedTokensWithAllowance).length
                ?
                <Button
                  className={'primary'}
                  icon={<MdOutlineNavigateNext/>}
                  onClick={() => hideModal()}
                >Close</Button>
                :
                <Button
                  className={'primary disabled'}
                  icon={<MdOutlineNavigateNext/>}
                >Complete</Button>
            )
        }
      </>
    )
  }, [cancelMigration, completeMigration, readyTokensCount, selectedTokensWithAllowance, setModalButtons, hidden, hideModal])

  if (hidden) return <></>

  return (
    <div>
      {
        readyTokensCount() < getConsolidatedTokensPure(selectedTokensWithAllowance).length
          ? <div
            className='small-asset-notification mb-3 warning'>{`${getConsolidatedTokensPure(selectedTokensWithAllowance).length - readyTokensCount()} actions left to complete the migration`}</div>
          : <div className='small-asset-notification mb-3 success'>
            {
              selectedTokensWithAllowance.find(t => t.permittable)
                ? 'Your tokens are ready to be migrated'
                : 'Your tokens were migrated. You can close this window'
            }
          </div>
      }
      {getConsolidatedTokensPure(selectedTokensWithAllowance, tokensPermissions, tokensTransfers, tokensPendingStatus).map((item, index) => (
        <div className='migration-asset-row' key={index}>
          <span className='migration-asset-select-icon migration-asset-select-icon-permit'>
            {
              (!item.icon || failedImg.includes(item.icon)) ?
                <GiToken size={18}/>
                :
                <img src={item.icon} draggable='false' alt='Token Icon' onError={(err) => {
                  setFailedImg(failed => [...failed, item.icon])
                }}/>
            }
          </span>
          <div className='migration-asset-name'>
            {item.name}
          </div>
          <div className='migration-asset-amount'>
            {new BigNumber(item.amount).div(10 ** item.decimals).toFixed()} <span
            className={'migration-asset-amount-usd'}>(${((item.amount) * item.rate).toFixed(2)})</span>
          </div>
          <div className='separator'>

          </div>
          <div>
            {!((item.allowance && ethers.BigNumber.from(item.allowance).gte(item.amount)) || item.sent)
              ?
              <>
                {item.permittable
                  ? (
                    <>
                      {!item.signature && !item.pending && <button className={'buttonComponent button-small secondary'}
                                                                   onClick={() => permitToken(item.address)}>Permit</button>}
                      {!item.signature && item.pending &&
                        <div className={'migration-permitted warning'}><FaHourglass/> Permitting...</div>}
                      {item.signature && <div className={'migration-permitted'}><FaCheck/> Permitted</div>}
                    </>
                  )
                  : (
                    <>
                      {(item.pending || item.signing)
                        ? <div className={'migration-permitted warning'}><FaHourglass/> Sending...</div>
                        :
                        <Button className={'button-small secondary'}
                                onClick={() => sendToken(item.address)}>
                          Send
                        </Button>
                      }
                    </>
                  )
                }
              </>
              :
              <div className={'migration-permitted'} onClick={() => sendToken(item.address)}><FaCheck/> Sent
              </div>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

export default AssetsMigrationPermitter
