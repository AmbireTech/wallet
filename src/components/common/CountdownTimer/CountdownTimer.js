import { useState, useEffect } from 'react'
import cn from 'classnames'
import { ReactComponent as ClockIcon } from 'resources/icons/clock.svg'

import styles from './CountdownTimer.module.scss'

const CountdownTimer = ({ seconds: initialSeconds, setTimeIsUp, className }) => {
  const [counter, setCounter] = useState(initialSeconds)
  const [timerFormatted, setTimerFormatted] = useState('')

  const isTimeIsUp = timerFormatted === '0:00'

  useEffect(() => {
    const timer = counter > 0 && setInterval(() => setCounter(counter - 1), 1000)
    const minutes = Math.floor(counter / 60)
    let seconds = counter - minutes * 60
    if (seconds < 10) {
      seconds = `0${seconds}`
    }

    if (isTimeIsUp) setTimeIsUp(true)
    setTimerFormatted(`${minutes}:${seconds}`)

    return () => clearInterval(timer)
  }, [counter, isTimeIsUp, setTimeIsUp])

  return (
    <div className={cn(styles.wrapper, className, { [styles.isTimeUp]: isTimeIsUp })}>
      <ClockIcon className={styles.clockIcon} />
      <p className={styles.text}>{timerFormatted}</p>
    </div>
  )
}

export default CountdownTimer
