import React, { useCallback, useEffect, useState } from 'react'
import './Segments.scss'

const Segments = ({ small, defaultValue, segments, onChange }) => {
  const [value, setValue] = useState(defaultValue)

  const setSegment = useCallback(
    (val) => {
      setValue(val)
      onChange(val)
    },
    [onChange]
  )

  useEffect(() => {
    setSegment(defaultValue)
  }, [defaultValue, setSegment])

  return (
    <div className={`segments ${small ? 'small' : ''}`}>
      {segments.map((segment) => (
        <div
          className={`segment ${segment.value === value ? 'active' : ''}`}
          key={segment.value}
          onClick={() => setSegment(segment.value)}
        >
          {segment.icon ? <div className="icon">{segment.icon}</div> : null}
          {segment.value}
        </div>
      ))}
    </div>
  )
}

export default Segments
