import './FinalCountdown.scss'
import { useLayoutEffect, useState } from 'react'
import { RiTimerFlashLine } from 'react-icons/ri'

function toTwoDigits(num) {
    if (num < 10) return `0${num}`
    return `${num}`
}

function getTimeDiff(now, end) {
    const diff = new Date(end).getTime() - new Date(now).getTime()
    return {
        days: toTwoDigits(Math.floor(diff / (1000 * 60 * 60 * 24))),
        hours: toTwoDigits(Math.floor((diff / (1000 * 60 * 60)) % 24)),
        minutes: toTwoDigits(Math.floor((diff / 1000 / 60) % 60)),
        seconds: toTwoDigits(Math.floor((diff / 1000) % 60)),
    }
}

export default function Countdown({ endDateTime, label }) {
    const [timeLeft, setTimeLef] = useState(null)

    useLayoutEffect(() => {
        if (endDateTime) {
            const interval = setInterval(
                () => setTimeLef(getTimeDiff(new Date(), endDateTime)),
                1000
            )
            return () => {
                clearInterval(interval)
            }
        } else {
            setTimeLef(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endDateTime])

    if (!timeLeft) return null

    return (
        <div>
            {label && <span>{label}</span>}
            <div className='final-countdown'>
                <RiTimerFlashLine className='timer-icon'/>
                <div className='unit-box'>
                    <div className='vale'>
                        {timeLeft.days}
                    </div>
                    <div className='unit'>
                        Days
                    </div>
                </div>
                :
                <div className='unit-box'>
                    <div className='vale'>
                        {timeLeft.hours}
                    </div>
                    <div className='unit'>
                        hours
                    </div>
                </div>
                :
                <div className='unit-box'>
                    <div className='vale'>
                        {timeLeft.minutes}
                    </div>
                    <div className='unit'>
                        minutes
                    </div>
                </div>
                :
                <div className='unit-box'>
                    <div className='vale'>
                        {timeLeft.seconds}
                    </div>
                    <div className='unit'>
                        seconds
                    </div>
                </div>
            </div>
        </div>
    )
}