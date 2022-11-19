import { useState } from 'react'
import cn from 'classnames'

import { ReactComponent as FallbackIcon } from 'resources/icons/fallback.svg'

import styles from  './Image.module.scss'

export default function Image({ src, fallback, size = 64, alt = 'image', imageClassName, failedClassName }) {

  const [failed, setFailed] = useState(false)

  return (
    <div className={styles.image} >
      {
        failed
          ? (fallback || <FallbackIcon className={cn(imageClassName, {[failedClassName]: failed && failedClassName})} />)
          : <img src={src}
                 draggable='false'
                 alt={alt}
                 style={{ maxWidth: size, maxHeight: size }}
                 onError={() => setFailed(true)}
                 className={cn(imageClassName, {[failedClassName]: failed && failedClassName})}
          />
      }
    </div>
  )
}
