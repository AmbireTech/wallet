import { useState } from 'react'
import './Image.scss'
import { FaImage } from 'react-icons/fa'

export default function Image({ src, fallback, size = 64, alt = 'image' }) {

  const [failed, setFailed] = useState(false)

  return (
    <div id='Image'>
      {
        failed
          ? (fallback || <FaImage/>)
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
