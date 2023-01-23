import { Button } from 'components/common'
import { useCallback } from 'react'

import styles from './SubComponents.module.scss'

const SeedWordsList = ({ words, setModalSteps }) => {

  const onWordsWrittenDown = useCallback(() => {
    setModalSteps(prev => {
      return { ...prev, stepIndex: 2 }
    })
  }, [setModalSteps])

  return <div>
    <div className={styles.instructions}>
      Please write down the following words in their respective order, on a piece of paper.<br/>
      We <b>do not</b> recommend to copy/paste or store those words on you computer.
    </div>
    <div className={styles.seedWordsList}>
      {
        words.map((word, index) => {
          return (<div className={styles.seedWordsListCell}>
            <span className={styles.seedWordsListIndex}>{index + 1}</span>
            <span className={styles.seedWordsListWord}>{word}</span>
          </div>)
        })
      }
    </div>
    <div className={styles.buttonHolder}>
      <Button full onClick={onWordsWrittenDown}>I wrote down those words</Button>
    </div>
  </div>
}

export default SeedWordsList
