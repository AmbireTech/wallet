import './FinalCountdown.scss'
import { useLayoutEffect, useState } from 'react'
import { RiTimerFlashLine } from 'react-icons/ri'

function toTwoDigits(num) {
  if (num < 10) return `0${num}`
  return `${num}`
}

function getTimeDiff(diff) {
  if (diff < 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00'
    }
  }

  return {
    days: toTwoDigits(Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours: toTwoDigits(Math.floor((diff / (1000 * 60 * 60)) % 24)),
    minutes: toTwoDigits(Math.floor((diff / 1000 / 60) % 60)),
    seconds: toTwoDigits(Math.floor((diff / 1000) % 60))
  }
}

export default function Countdown({ endDateTime, label }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useLayoutEffect(() => {
    if (endDateTime) {
      let interval = setInterval(() => {
        const diff = new Date(endDateTime).getTime() - new Date().getTime()
        setTimeLeft(getTimeDiff(diff))
        if (diff < 0) {
          clearInterval(interval)
          interval = null
        }
      }, 1000)
      return () => {
        clearInterval(interval)
        interval = null
      }
    }
    setTimeLeft(null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDateTime])

  if (!timeLeft) return null

  return (
    <div>
      {label && <span>{label}</span>}
      <div className="final-countdown">
        <RiTimerFlashLine className="timer-icon" />
        <div className="unit-box">
          <div className="value">{timeLeft.days}</div>
          <div className="unit">days</div>
        </div>
        <div className="value">:</div>
        <div className="unit-box">
          <div className="value">{timeLeft.hours}</div>
          <div className="unit">hours</div>
        </div>
        <div className="value">:</div>
        <div className="unit-box">
          <div className="value">{timeLeft.minutes}</div>
          <div className="unit">minutes</div>
        </div>
        <div className="value">:</div>
        <div className="unit-box">
          <div className="value">{timeLeft.seconds}</div>
          <div className="unit">seconds</div>
        </div>
      </div>
    </div>
  )
}
