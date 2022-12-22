import { useEffect, useState } from 'react'
import styles from  './Image.module.scss'
import cn from 'classnames'
import { FaImage } from 'react-icons/fa'

export default function Image({ src, fallback, className, size = 64, alt = 'image' }) {

  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div className={cn(styles.image, className)} >
      {
        failed
          ? (fallback || <FaImage />)
          : <img src={src}
                 draggable='false'
                 alt={alt}
                 style={{ maxWidth: size, maxHeight: size }}
                 onError={() => setFailed(true)}
          />
      }
    </div>
  )
}
