import { Button, TextInput } from 'components/common'
import { useCallback, useEffect, useState, useRef } from 'react'
import { FaTimes, FaCheck } from 'react-icons/fa'
import { Wallet } from 'ethers'

const ImportSeedWordsForm = ({ setError, setModalSteps, foundAddress, setFoundAddress }) => {

  const [currentWord, setCurrentWord] = useState(null)
  const [words, setWords] = useState([])
  const [previewDeletionIndex, setPreviewDeletionIndex] = useState(null)
  const [modifyingIndex, setModifyingIndex] = useState(null)

  const textFieldRef = useRef()

  const validateWord = useCallback(() => {
    if (!currentWord) {
      setError('Invalid seed word')
      return
    }
    setError(null)
    // regexp
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
  }, [currentWord, setError, modifyingIndex])

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

  useEffect(() => {
    if (words.length < 12) {
      setFoundAddress(null)
      return
    }
    try {
      const wallet = Wallet.fromMnemonic(words.join(' '))
      setFoundAddress(wallet.address)
    } catch (e) {
      setFoundAddress(null)
      setError('Could not compute address: ' + e.message + '. Please check and delete the incorrect words')
    }
  }, [setError, words, setFoundAddress])

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
      !!words.length &&
      <div className={`importedSeedWordsList${modifyingIndex !== null ? ' modifyMode' : ''}`}>
        {
          words.map((w, index) => {
            return <div
              className={`importedSeedWord${previewDeletionIndex !== null && previewDeletionIndex <= index ? ' deletable' : ''}${modifyingIndex === index ? ' modifiable' : ''}`}
              onClick={() => {
                if (modifyingIndex === null) modifyWord(index)
              }}
              key={index}
            >
              <span className='index'>{index + 1}</span>
              <span className='word'>{modifyingIndex === index ? (currentWord) : w}</span>
              {
                modifyingIndex === index
                  ? <span className='modifying'
                          onClick={() => validateModification()}>
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
        <div className='buttonHolder'>
          <Button full
                  onClick={() => {
                    setModalSteps(prev => ({ ...prev, stepIndex: 1 }))
                  }}
          >
            Continue
          </Button>
        </div>
      </div>
    }
  </div>

}

export default ImportSeedWordsForm
