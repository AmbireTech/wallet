import './CountdownTimer.scss'

import { useState, useEffect } from 'react'
import { MdOutlineAvTimer } from 'react-icons/md'

const CountdownTimer = ({ seconds, setTimeIsUp }) => {
    const [counter, setCounter] = useState(seconds)
    const [timerFormatted, setTimerFormatted] = useState('')

    const isTimeIsUp = timerFormatted === '0:00'
    
    useEffect(() => {
        const timer =
            counter > 0 && setInterval(() => setCounter(counter - 1), 1000)
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
        <div
            id="countdown-timer"
            style={isTimeIsUp ? { color: 'red' } : {}}
        >
            <MdOutlineAvTimer /> {timerFormatted}
        </div>
    )
}

export default CountdownTimer
