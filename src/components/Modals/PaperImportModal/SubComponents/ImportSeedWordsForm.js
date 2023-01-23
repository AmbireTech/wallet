import { Button, TextInput, Loading } from 'components/common'
import { useCallback, useEffect, useState, useRef } from 'react'
import { FaTimes, FaCheck, FaSync, FaInfoCircle } from 'react-icons/fa'
import { Wallet } from 'ethers'
import { fetchGet } from 'lib/fetch'

import styles from './SubComponents.module.scss'

const ImportSeedWordsForm = ({ accounts, selectedAccount, setModalSteps, foundAddress, setFoundAddress, setWallet, relayerURL, newAccount, retrievedIdentity, setRetrievedIdentity, hideModal, setModalButtons }) => {

  // we don't want to pass because we want to display the error further down in the modal instead
  const [error, setError] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [words, setWords] = useState([])
  const [previewDeletionIndex, setPreviewDeletionIndex] = useState(null)
  const [modifyingIndex, setModifyingIndex] = useState(null)

  const [possibleRetrievedIdentities, setPossibleRetrievedIdentities] = useState(null)

  const [networkFetchError, setNetworkFetchError] = useState(null)

  const textFieldRef = useRef()

  const validateWord = useCallback(() => {
    setFoundAddress(null)
    if (!currentWord) {
      setError('Invalid seed word')
      return
    }
    setError(null)

    // in case the user is pasting the whole words
    if (words.length === 0) {
      const pastedWords = currentWord.split(' ')
      if (pastedWords.length === 12) {
        let sanitizedPastedWords = []
        for (let w of pastedWords) {
          if (w.trim().match(/^[A-Za-z]+$/g)) {
            sanitizedPastedWords.push(w.trim())
          } else {
            setError('Invalid seed word ' + w)
            return
          }
        }
        setCurrentWord('')
        setWords(sanitizedPastedWords)
        return
      }
    }

    const sanitized = currentWord.trim()
    if (!sanitized.match(/^[A-Za-z]+$/g)) {
      setError('Invalid seed word')
    } else {
      if (modifyingIndex !== null) {
        setModifyingIndex(null)
        setWords(prev => {
          prev[modifyingIndex] = sanitized
          return [...prev]
        })
      } else {
        setWords(prev => [...prev, sanitized])
      }
      setCurrentWord('')
    }
  }, [setFoundAddress, currentWord, words.length, modifyingIndex])

  const onTextFieldChange = useCallback((val) => {
    if (val.trim() !== currentWord) {
      setError(null)
    }
    setCurrentWord(val.trim())
  }, [currentWord, setError])

  const onTextFieldKeyDown = (key) => {
    if (key === 'Enter' || key === ' ') {
      validateWord()
    }
  }

  const previewDeletion = useCallback((index) => {
    if (modifyingIndex !== null) return
    setPreviewDeletionIndex(index)
  }, [modifyingIndex])

  const cancelPreviewDeletion = useCallback(() => {
    setPreviewDeletionIndex(null)
  }, [])

  const deleteWord = useCallback((index) => {
    if (modifyingIndex !== null) return
    setWords(prev => {
      return prev.slice(0, index)
    })
    cancelPreviewDeletion()
    setError(null)
  }, [cancelPreviewDeletion, setError, modifyingIndex])

  const modifyWord = useCallback((index) => {
    setError(null)
    setModifyingIndex(index)
    setCurrentWord(words[index])
  }, [words, setError])

  const validateModification = useCallback(() => {
    setModifyingIndex(null)
    validateWord()
  }, [validateWord])

  const onValidate = useCallback(() => {
    // is there a way to share between comps without leaking wallet in memory
    setWallet(Wallet.fromMnemonic(words.join(' ')))
    setModalSteps(prev => ({ ...prev, stepIndex: 1 }))
  }, [setWallet, setModalSteps, words])

  const validateSeedWords = useCallback(() => {
    setModalButtons(null)
    if (words.length < 12) {
      return
    }
    try {
      const wallet = Wallet.fromMnemonic(words.join(' '))
      setFoundAddress(wallet.address)
      setRetrievedIdentity(null)
    } catch (e) {
      setFoundAddress(null)
      setError('Could not compute address: ' + e.message + '. Please check and delete the incorrect words')
    }
  }, [setModalButtons, words, setFoundAddress, setRetrievedIdentity])

  const checkMatchingIdentity = useCallback(async() => {
    if (!foundAddress) return
    if (words.length !== 12) return
    setNetworkFetchError(null)

    let wallet
    try {
      wallet = Wallet.fromMnemonic(words.join(' '))
    } catch (e) {
      setError('Failed to compute address:' + e.message)
      return
    }

    const signature = await wallet.signMessage('get_identity_from_signer')

    const url = `${relayerURL}/account-by-quickAccPrimaryKey/${signature}`

    fetchGet(url)
      .then(result => {
        if (result.success) {
          if (result.identities.length === 1) {
            setRetrievedIdentity(result.identities[0])
          } else {
            setPossibleRetrievedIdentities(result.identities)
          }
        } else {
          setRetrievedIdentity(false)
        }
      })
      .catch(err => {
        setNetworkFetchError(err.message)
      })
  }, [foundAddress, words, relayerURL, setRetrievedIdentity])

  const pickPossibleIdentity = useCallback((identity) => {
    setPossibleRetrievedIdentities(null)
    setRetrievedIdentity(identity)
  }, [setRetrievedIdentity])

  useEffect(() => {
    if (retrievedIdentity) {
      const existing = accounts && accounts.find(a => a.id.toLowerCase() === retrievedIdentity.id.toLowerCase() && !!a.primaryKeyBackup)

      if (existing) {
        setModalButtons(<Button clear className={styles.button} onClick={() => hideModal()} >
          Close
        </Button>)
      } else {
        setModalButtons(<Button className={styles.button} onClick={onValidate} >
          Continue
        </Button>)
      }
    }
  }, [accounts, hideModal, onValidate, retrievedIdentity, setModalButtons])

  useEffect(() => {
    validateSeedWords()
  }, [validateSeedWords])

  useEffect(() => {
    checkMatchingIdentity()
  }, [checkMatchingIdentity])

  useEffect(() => {
    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [])


  const renderRetrievedIdentityFeedback = useCallback(() => {
    if (retrievedIdentity !== null) {
      if (retrievedIdentity === false) {
        return (<div className='error-message'>Could not retrieve Ambire account from this signer</div>)
      }
      if (!newAccount && retrievedIdentity.id.toLowerCase() !== selectedAccount.id.toLowerCase()) {
        return (
          <div className='error-message'>
            The signer account you imported does not belong to the selected Ambire account {selectedAccount.id}.<br />
            <br />
            This signer account belongs to the Ambire account {retrievedIdentity.id}
          </div>
        )
      }

      if (newAccount || retrievedIdentity.id.toLowerCase() === selectedAccount.id.toLowerCase()) {

        const existing = accounts && accounts.find(a => a.id.toLowerCase() === retrievedIdentity.id.toLowerCase() && !!a.primaryKeyBackup)

        return (
          <div>
            <div>
              <b>Ambire account</b>
              <div className='address'>{retrievedIdentity.id}</div>
            </div>
            {
              existing &&
              <div className='notification-hollow info'>
                You have already added this account
              </div>
            }
          </div>
          )
      }
    }
  }, [retrievedIdentity, newAccount, selectedAccount, accounts])

  return <div>
    <div className={styles.instructions}>
      Type in the words in the order they appear on your paper backup.<br />
      <span className={styles.unimportant}>Press <i>enter</i> or <i>space</i> after each word
      to validate it</span>
    </div>
    {
      (words.length < 12 || modifyingIndex !== null) &&
      <div className={styles.seedWordsForm}>
        <TextInput
          placeholder={`Word #${modifyingIndex !== null ? (modifyingIndex + 1) : (words.length + 1)}`}
          value={currentWord}
          onChange={onTextFieldChange}
          onKeyDown={onTextFieldKeyDown}/>
      </div>
    }
    {
      error && <div className='error-message'>
        {error}
      </div>
    }
    {
      !!words.length &&
      <div
        className={`${styles.importedSeedWordsList} ${modifyingIndex !== null ? styles.modifyMode : ''}`}
        onClick={() => {
          if (modifyingIndex !== null) {
            setModifyingIndex(null)
            validateSeedWords()
          }
        }}
      >
        {
          words.map((w, index) => {
            return <div
              className={`${styles.importedSeedWord} ${previewDeletionIndex !== null && previewDeletionIndex <= index ? styles.deletable : ''}${modifyingIndex === index ? styles.modifiable : ''}`}
              onClick={() => {
                if (modifyingIndex === null) {
                  modifyWord(index)
                }
              }}
              key={index}
            >
              <span className={styles.index}>{index + 1}</span>
              <span className={styles.word}>{modifyingIndex === index ? (currentWord) : w}</span>
              {
                modifyingIndex === index
                  ? <span className={styles.modifying}
                          onClick={(e) => {
                            e.stopPropagation()
                            validateModification()
                          }}>
                      <FaCheck/>
                    </span>
                  : <span className={styles.close}
                          onClick={(e) => {
                            deleteWord(index)
                            e.stopPropagation()
                            return false
                          }}
                          onMouseEnter={() => previewDeletion(index)}
                          onMouseLeave={cancelPreviewDeletion}>
                      <FaTimes/>
                    </span>
              }
            </div>
          })
        }
        {
          // Please someone fixes this in CSS (pixel perfect aligned cols when items not 3 in a row)
          words.length % 3 !== 0 &&
          [...Array(3 - words.length % 3)].map(a => {
            return <span className={styles.empty}></span>
          })
        }
      </div>
    }

    {
      (foundAddress && modifyingIndex === null) &&
      <div className={styles.foundAddressContainer}>
        <b>Signer Account</b>
        <div className={styles.address}>{foundAddress}</div>
        {
          ((retrievedIdentity === null && possibleRetrievedIdentities === null) && !networkFetchError) &&
          <Loading />
        }
        {
          networkFetchError &&
          <div className={`error-message ${styles.networkFetchError}`}>
            Network error while getting matching account: {networkFetchError}
            <Button full small icon={<FaSync />} onClick={checkMatchingIdentity}>Try again</Button>
          </div>
        }
        {
          possibleRetrievedIdentities
          ? (
            <div className={styles.identitiesSelector}>
              <p className={`${styles.notificationHollow} ${styles.info}`}>
                <FaInfoCircle /> Multiple wallets found for this signer.
                Please select the wallet to import.
              </p>
              <div className={styles.identitiesSelectorHolder}>
                {possibleRetrievedIdentities.map(identity => {
                  return (<div onClick={() => pickPossibleIdentity(identity)}>{identity.id}</div>)
                })}
              </div>
            </div>
          )
          : (
              renderRetrievedIdentityFeedback()
          )
        }
      </div>
    }
  </div>

}

export default ImportSeedWordsForm
