import { Button } from 'components/common'
import { useCallback, useEffect, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { FaCheck } from 'react-icons/fa'

import styles from './SubComponents.module.scss'

const VerifySeedWords = ({ words, setModalButtons, hideModal, onAddAccount, selectedAccount, accounts }) => {

  const [error, setError] = useState(null)
  const [wordIndex, setWordIndex] = useState(0)
  const [selectedWordFeedback, setSelectedWordFeedback] = useState({})
  const [animationNextWord, setAnimationNextWord] = useState(false)

  // to seed random sort words for verification
  const randNum = (word) => {
    let asciiNumStr = '0'
    for (let i = 0; i < word.length; i++) {
      asciiNumStr += word.charCodeAt(i) + ''
    }

    // some random reducer
    let finalNum = asciiNumStr
    while (finalNum > 100) {
      finalNum = (finalNum.slice(0, finalNum.length - 2) * 1 + finalNum.slice(finalNum.length - 2) * 1) + ''
    }
    return finalNum * 1
  }

  // getting 4 words to pick from, including the correct one
  const getWordChoices = useCallback(() => {
    const correctWord = words[wordIndex]

    const shuffledWordsList = [...words.slice(0, wordIndex), ...words.slice(wordIndex + 1)]
      .sort((a, b) => randNum(a) - randNum(b))

    // quick hack to loop over end of array
    const wordsStream = [...shuffledWordsList, ...shuffledWordsList]

    return [correctWord, ...wordsStream.slice(wordIndex, wordIndex + 3)]
      .sort((a, b) => {
        return randNum(a) - randNum(b)
      }).map((w, index) => {
        return {
          word: w,
          selected: selectedWordFeedback.index === index,
          correct: correctWord === w
        }
      })
  }, [words, wordIndex, selectedWordFeedback])

  const selectWord = useCallback((selectedWord, selectedIndex) => {
    setError(null)

    const correct = words[wordIndex] === selectedWord
    setSelectedWordFeedback({ index: selectedIndex, correct })

    // word click animation
    setTimeout(() => {
      if (words[wordIndex] === selectedWord) {
        setAnimationNextWord(true)
        setTimeout(() => {
          setSelectedWordFeedback({})
          setTimeout(() => {
            setWordIndex(wordIndex + 1)
            setAnimationNextWord(false)
          }, 150)
        }, 150)
      } else {
        setSelectedWordFeedback({})
        setError(`The word you selected is not the correct word #${wordIndex + 1}`)
      }
    }, 400)
  }, [words, wordIndex, setError])

  // Display final closing button when all the words are verified
  useEffect(() => {
    if (wordIndex > 11) {
      const currentAccount = accounts.find(a => selectedAccount.id.toLowerCase() === a.id.toLowerCase())
      if (currentAccount) {
        onAddAccount({
          ...currentAccount,
          downloadedBackup: true,
          backupOptout: false
        })
      } else {
        console.error('could not find account for ' + selectedAccount.id)
      }

      setModalButtons(<Button
        full
        icon={<MdClose/>}
        className={`primary ${styles.button}`}
        onClick={() => hideModal()}
      >Close</Button>)
    }
  }, [wordIndex, setModalButtons, hideModal, accounts, selectedAccount, onAddAccount])

  if (wordIndex > 11) {
    return <div className='notification-hollow success text-center mt-4'>
      Verification complete!<br/>
      You should now put your paper in a safe place
    </div>
  }

  return <div>
    <div className={styles.instructions}>
      To make sure your backup is perfect, please verify your backup by clicking on the correct word
    </div>

    <div className={styles.wordsSelectorContainer}>
      <div className={styles.wordRequestedTitle}>
        Select the word as it appears on your backup
      </div>

      <div className={`${styles.wordsSelector} ${animationNextWord ? styles.nextWordFade : ''}`}>
        <div className={styles.wordIndex}>
          Word <span>#{wordIndex + 1}</span>
        </div>
        <div className={`${styles.wordChoices} ${selectedWordFeedback.correct ? styles.animated : ''}`}>
          {
            getWordChoices().map((w, index) => {
              return (<span
                className={`${styles.wordChoice} ${w.selected ? (' selected ' + (w.correct ? styles.correct : styles.incorrect)) : ''}`}
                onClick={() => selectWord(w.word, index)}>{w.word}
              </span>)
            })
          }
        </div>
        {
          selectedWordFeedback.correct &&
          <div className={styles.visualCheckmark}><FaCheck/></div>
        }
      </div>

      {
        error &&
        <div className={`${styles.errorMessage} error-message`}>
          {error}
        </div>
      }
    </div>
  </div>
}

export default VerifySeedWords
