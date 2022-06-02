import { ethers } from 'ethers'

import { useModals } from 'hooks'
import { Modal, Button, AmbireLoading, TextInput } from 'components/common'
import { ledgerGetAddresses } from 'lib/ledgerWebHID'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MdClose, MdOutlineNavigateNext, MdRefresh, MdEdit, MdSettings } from 'react-icons/md'
import { FaPlus, FaMinus } from 'react-icons/fa'

import './LedgerSignersModal.scss'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger'
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders'

import { DEFAULT_DERIVATION_PATH } from 'lib/ledgerUtils'

const LEDGER_LIVE_DEFAULT_PATH = DEFAULT_DERIVATION_PATH

const PATHS = [
  {
    id: 'ethereum',
    model: 'Ethereum',
    path: `m/44'/60'/0'/n`
  },
  {
    id: 'ledger',
    model: 'Ethereum Ledger',
    path: `m/44'/60'/n'`
  },
  {
    id: 'ledgerLive',
    model: 'Ethereum Ledger Live',
    path: `m/44'/60'/n'/0/0`
  },
]

const LedgerSignersModal = ({ onLedgerAccountSelection, isWebHID }) => {

  const { hideModal } = useModals()
  const [account, setAccount] = useState(null) // {address, signerExtra}
  const [isLoading, setIsLoading] = useState(true)
  const [isShowDerivation, setIsShowDerivation] = useState(false)
  const [accountIndex, setAccountIndex] = useState(0)
  const [derivationPath, setDerivationPath] = useState(LEDGER_LIVE_DEFAULT_PATH)
  const [txtCustomDerivationPath, setTxtCustomDerivationPath] = useState('')
  const [error, setError] = useState(null)
  const [isAdvancedShown, setIsAdvancedShown] = useState(false)

  const txtCustomDerivationPathRef = useRef(0) // for field focusing

  const checkDerivationPath = useCallback((path) => {
    setError(null)
    // catch the invalid path errors
    const hdNode = ethers.utils.HDNode.fromSeed(ethers.utils.arrayify('0x000000000000000000000000000000000000000000000000000000'))
    try {
      return !!hdNode.derivePath(path)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const onSelectPath = useCallback(() => {
    setError(null)
    if (txtCustomDerivationPath && txtCustomDerivationPath !== derivationPath) {
      if (checkDerivationPath(txtCustomDerivationPath)) {
        setAccount(null)
        setDerivationPath(txtCustomDerivationPath)
        setIsShowDerivation(false)
      }
    } else {
      setIsShowDerivation(false)
    }

  }, [checkDerivationPath, txtCustomDerivationPath, derivationPath])

  const onSelect = useCallback(() => {
    if (account) {
      hideModal()
      if (isWebHID) {
        onLedgerAccountSelection(account.address, { type: 'ledger', transportProtocol: 'webHID', ...account.extra })
      } else {
        onLedgerAccountSelection(account.address, { type: 'ledger', transportProtocol: 'U2F', ...account.extra })
      }
    }
  }, [account, onLedgerAccountSelection, hideModal, isWebHID])

  const getButtons = useCallback(() => {
    if (isShowDerivation) {
      return <>
        <Button clear icon={<MdClose/>} onClick={() => setIsShowDerivation(false)}>Cancel</Button>
        <Button icon={<MdOutlineNavigateNext/>} className='primary' onClick={onSelectPath}>Select</Button>
      </>
    }

    return <>
      <Button clear icon={<MdClose/>} onClick={hideModal}>Cancel</Button>
      <Button icon={<MdOutlineNavigateNext/>} className={`primary${!account ? ' disabled' : ''}`}
              onClick={onSelect}>Select</Button>
    </>
  }, [isShowDerivation, hideModal, account, onSelect, onSelectPath])

  const loadAccount = useCallback(() => {
    setError(null)
    setIsLoading(true)

    if (isWebHID) {
      ledgerGetAddresses(derivationPath, 4)// To change to 1
        .then(addresses => {
          setAccount({ address: addresses[0], extra: { derivationPath } })
        })
        .catch(e => {
          setError(e.message)
        })
        .then(() => setIsLoading(false))
    } else {

      const getU2fAccounts = async () => {

        const parent = derivationPath.endsWith('\'') ? derivationPath : derivationPath.split('/').slice(0, -1).join('/')
        const child = derivationPath.endsWith('\'') ? 0 : derivationPath.split('/').slice(-1)[0] * 1

        const provider = new LedgerSubprovider({
          networkId: 0, // @TODO: probably not needed
          ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
          baseDerivationPath: parent
        })
        // NOTE: do not attempt to do both of these together (await Promise.all)
        // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
        // cause one call won't be aware of the other's attempt to connect
        const address = (await provider.getAccountsAsync(child + 1)).slice(-1)[0]

        const signerExtra = await provider._initialDerivedKeyInfoAsync().then(info => ({
          type: 'ledger',
          info: JSON.parse(JSON.stringify(info)),
          childIndex: child
        }))

        return {
          address,
          signerExtra
        }
      }

      getU2fAccounts().then(result => {
        setAccount({ address: result.address, extra: result.signerExtra })
      }).catch(e => {
        setError(e.message)
      }).then(() => setIsLoading(false))
    }
  }, [derivationPath, isWebHID])

  // fill path text field
  const onCopyPath = useCallback((path) => {
    setTxtCustomDerivationPath(path)
  }, [])

  // initial loading accs + loading on derivationPath change
  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  // reinit values when derivation panel is shown + focus on text field
  useEffect(() => {
    if (isShowDerivation) {
      setTxtCustomDerivationPath(null)
      setAccountIndex(0)
      txtCustomDerivationPathRef.current.focus()
    }
  }, [isShowDerivation])

  // replace n by child index in path
  const getDerivationPath = (id, index) => {
    const split = PATHS.find(p => p.id === id).path.split('n')

    const arrPath = (split.length > 1) ? [split[0], index, split[1]] : split

    // returning jsx or string
    return isNaN(index) ? arrPath : arrPath.join('')
  }

  return (
    <Modal id='ledger-signers-modal' title={'Select Ledger account'} buttons={getButtons()}>
      {
        error && <div className='notification-hollow danger'>{error}</div>
      }

      {
        (!isShowDerivation && error && !account) && (
          <div className='retryContainer'>
            <Button small onClick={() => loadAccount()} className='secondary' icon={<MdRefresh/>}>Retry</Button>
          </div>
        )
      }

      {
        isShowDerivation
          ? (
            <div>
              <div className='derivationPathInputContainer'>
                <span className='derivationPathInputLabel'>
                  Full derivation path
                </span>
                <TextInput placeholder={LEDGER_LIVE_DEFAULT_PATH}
                           onChange={(val) => setTxtCustomDerivationPath(val)}
                           ref={txtCustomDerivationPathRef}
                           value={txtCustomDerivationPath}
                           small
                />
              </div>

              <div className='derivationPathHelper'>
                <h4 className='tablePaths-title'>Not sure which derivation path to chose?</h4>

                <table className='tablePaths'>
                  {
                    PATHS.map(p => {
                      return (
                        <tr key={p.model}>
                          <td>{p.model}</td>
                          <td>
                            <span className='copyPath'
                                  onClick={() => onCopyPath(getDerivationPath(p.id, accountIndex))}>
                              {getDerivationPath(p.id, <span className='childIndex'>{accountIndex}</span>)}
                            </span>
                          </td>
                          <td>
                            <div className='intStepper'>
                              <button onClick={(e) => {
                                setAccountIndex(old => old + 1)
                                e.preventDefault()
                                return false
                              }}><FaPlus/></button>
                              <button onClick={(e) => {
                                setAccountIndex(old => Math.max(old - 1, 0))
                                e.preventDefault()
                                return false
                              }}><FaMinus/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }
                </table>

                <p className='ledgerComment'>
                  The <span>last digit</span> of is child index or the base derivation path. Change this number to compute
                  sibling addresses.<br/>
                  <br/>
                  The full derivation path includes the child index as the last part or the path.<br/>
                  <br/>
                  Note: Ledger Live computes addresses by hardening a child 2 levels upwards
                </p>
              </div>
            </div>
          )
          : (
            <div>
              {
                isLoading && <div className='loaderContainer'>
                  <h3 className={'mb-6'}>Waiting for ledger...</h3>
                  <AmbireLoading/>
                </div>
              }

              {
                account &&
                <>
                  <div className='selectedAddress'>
                    <b>Address found</b>
                    <span>{account.address}</span>
                  </div>

                  {
                    isAdvancedShown
                      ? (
                        <div className='derivationPathInfo'>
                          <span className='derivationPathInfo-title'>Derivation path settings</span>
                          {
                            LEDGER_LIVE_DEFAULT_PATH === derivationPath
                              ? (
                                <div>
                                  This address is computed from to the default ledger derivation path:<br/>
                                </div>
                              )
                              : (
                                <div>
                                  This address is computed from the custom derivation path:<br/>
                                </div>
                              )
                          }
                          <div className='selectedDerivationPath'
                               onClick={(e) => {
                                 setIsShowDerivation(true)
                                 e.preventDefault()
                               }}>
                        <span>
                          {derivationPath}
                        </span>
                            <span className='selectedDerivationPath-edit'>
                          <MdEdit/>
                        </span>
                          </div>
                        </div>
                      )
                      : (
                        <div className='advancedSettings-link' onClick={() => setIsAdvancedShown(true)}>
                          <MdSettings/> Advanced settings
                        </div>
                      )
                  }
                </>
              }
            </div>
          )
      }
    </Modal>
  )
}

export default LedgerSignersModal
