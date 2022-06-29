import { Button } from 'components/common'
import { useCallback } from 'react'

const SeedWordsList = ({ words, setModalSteps }) => {

  const onWordsWrittenDown = useCallback(() => {
    setModalSteps(prev => {
      return { ...prev, stepIndex: 2 }
    })
  }, [setModalSteps])

  return <div>
    <div className='instructions'>
      Please write down the following words in order, on a piece of paper.<br/>
      We <b>do not</b> recommend to copy/paste or store those words on you computer.
    </div>
    <div className='seedWordsList'>
      {
        words.map((word, index) => {
          return (<div className='seedWordsList-cell'>
            <span className='seedWordsList-index'>{index + 1}</span>
            <span className='seedWordsList-word'>{word}</span>
          </div>)
        })
      }
    </div>
    <div className='buttonHolder'>
      <Button full onClick={onWordsWrittenDown}>I wrote down those words</Button>
    </div>
  </div>

}

export default SeedWordsList
