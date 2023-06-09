import { useCallback, useEffect, useState } from 'react'
import cn from 'classnames'

import styles from './Segments.module.scss'

const Segments = ({ small, defaultValue, segments, onChange }) => {
  const [value, setValue] = useState(defaultValue)

  const setSegment = useCallback(
    (newValue) => {
      setValue(newValue)
      onChange(newValue)
    },
    [onChange]
  )

  useEffect(() => {
    setSegment(defaultValue)
  }, [defaultValue, setSegment])

  return (
    <div className={cn(styles.segments, { [styles.small]: small })}>
      {segments.map((segment) => (
        <button
          type="button"
          className={cn(styles.segment, { [styles.active]: segment.value === value })}
          key={segment.value}
          onClick={() => setSegment(segment.value)}
        >
          {segment.icon ? <div className={styles.icon}>{segment.icon}</div> : null}
          {segment.value}
        </button>
      ))}
    </div>
  )
}

export default Segments
