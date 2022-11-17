import React, { useState } from 'react'
import { FaImage } from 'react-icons/fa'
import cn from 'classnames'
import styles from './Image.module.scss'

export default function Image({ src, fallback, size = 64, alt = 'image' }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn(styles.image)}>
      {failed ? (
        fallback || <FaImage />
      ) : (
        <img
          src={src}
          draggable="false"
          alt={alt}
          style={{ maxWidth: size, maxHeight: size }}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
