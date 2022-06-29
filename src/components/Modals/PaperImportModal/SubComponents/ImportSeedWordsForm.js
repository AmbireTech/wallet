import { Button, TextInput, Loading } from 'components/common'
import { useCallback, useEffect, useState, useRef } from 'react'
import { FaTimes, FaCheck, FaSync } from 'react-icons/fa'
import { Wallet } from 'ethers'
import { fetchGet } from 'lib/fetch'

const ImportSeedWordsForm = ({ selectedAccount, setModalSteps, foundAddress, setFoundAddress, setWallet, relayerURL }) => {

  // we don't want to pass because we want to display the error further down in the modal instead
  const [error, setError] = useState(null)
  const [currentWord, setCurrentWord] = useState(null)
  const [words, setWords] = useState([])
  const [previewDeletionIndex, setPreviewDeletionIndex] = useState(null)
  const [modifyingIndex, setModifyingIndex] = useState(null)
  const [signerMatchesIdentity, setSignerMatchesIdentity] = useState(null)
  const [networkFetchError, setNetworkFetchError] = useState(null)

  const textFieldRef = useRef()

  const validateWord = useCallback(() => {
    if (!currentWord) {
      setError('Invalid seed word')
      return
    }
    setError(null)

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
  }, [currentWord, setError, words, modifyingIndex])

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
    if (words.length < 12) {
      setFoundAddress(null)
      return
    }
    try {
      const wallet = Wallet.fromMnemonic(words.join(' '))
      setFoundAddress(wallet.address)
      setSignerMatchesIdentity(null)
    } catch (e) {
      setFoundAddress(null)
      setError('Could not compute address: ' + e.message + '. Please check and delete the incorrect words')
    }
  }, [setError, words, setFoundAddress])

  const checkMatchingIdentity = useCallback(() => {
    if (!foundAddress) return
    setNetworkFetchError(null)
    const url = 'https://deelay.me/1500/https://api.coingecko.com/api/v3/ping\n'

    fetchGet(url)
      .then(result => {
        //throw Error('lol err')
        if (result.gecko_says) {
          setSignerMatchesIdentity(true)
        } else {
          setSignerMatchesIdentity(false)
        }
      })
      .catch(err => {
        setNetworkFetchError(err.message)
      })
  }, [foundAddress])

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

  return <div>
    <div className='instructions'>
      Enter the words in order, as appearing on your backed up paper. Press <i>enter</i> or <i>space</i> after the word
      to validate it
    </div>
    {
      (words.length < 12 || modifyingIndex !== null) &&
      <div className='seedWordsForm'>
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
        className={`importedSeedWordsList${modifyingIndex !== null ? ' modifyMode' : ''}`}
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
              className={`importedSeedWord${previewDeletionIndex !== null && previewDeletionIndex <= index ? ' deletable' : ''}${modifyingIndex === index ? ' modifiable' : ''}`}
              onClick={() => {
                if (modifyingIndex === null) {
                  modifyWord(index)
                }
              }}
              key={index}
            >
              <span className='index'>{index + 1}</span>
              <span className='word'>{modifyingIndex === index ? (currentWord) : w}</span>
              {
                modifyingIndex === index
                  ? <span className='modifying'
                          onClick={(e) => {
                            e.stopPropagation()
                            validateModification()
                          }}>
                      <FaCheck/>
                    </span>
                  : <span className='close'
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
            return <span className='empty'></span>
          })
        }
      </div>
    }

    {
      (foundAddress && modifyingIndex === null) &&
      <div className='foundAddressContainer'>
        <b>Address</b>
        <div className='foundAddress'>{foundAddress}</div>
        {
          (signerMatchesIdentity === null && !networkFetchError) &&
          <Loading />
        }
        {
          networkFetchError &&
          <div className='error-message networkFetchError'>
            Network error while getting matching account: {networkFetchError}
            <Button full small icon={<FaSync />} onClick={checkMatchingIdentity}>Try again</Button>
          </div>
        }
        {
          signerMatchesIdentity === false &&
          <div className='error-message'>
            Could not match this signer address with the selected account. Are you sure this is the backup for {selectedAccount.id} ?
          </div>
        }
        {
          signerMatchesIdentity &&
          <div className='buttonHolder'>
            <Button full onClick={onValidate} >
              Continue
            </Button>
          </div>
        }
      </div>
    }
  </div>

}

export default ImportSeedWordsForm
