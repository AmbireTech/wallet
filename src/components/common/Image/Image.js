import './Image.scss'
import { useState } from 'react'
import { GiToken } from 'react-icons/gi'

export default function Image({ url, alt, size = 64 }) {

  const [failed, setFailed] = useState(null)

  return (
    <span className='image'>
      {
        failed
          ? <GiToken size={size}/>
          : <img src={url}
                 draggable='false'
                 alt={alt}
                 onError={(err) => {
                   setFailed(true)
                 }}
          />
      }
    </span>
  )
}
