import React, { useEffect, useState } from 'react'
import cn from 'classnames'

import { ReactComponent as FallbackIcon } from 'resources/icons/fallback.svg'

import styles from './Image.module.scss'

const isFailed = (src) => !src

function Image({
  src,
  fallback,
  size = 64,
  alt = 'image',
  className,
  imageClassName,
  failedClassName
}) {
  // In case we have a falsy `src` value (undefined, empty string, etc.) <img> `onError` callback is not being triggered,
  // because the `src` prop is not being attached at all to the <img> tag (I guess JSX omits falsy props for the `src` prop).
  // That's the reason why we set `failed` value initially, based on the `src` value.
  const [failed, setFailed] = useState(isFailed(src))
  useEffect(() => {
    setFailed(isFailed(src))
  }, [src])

  return (
    <div className={cn(styles.image, className)}>
      {failed ? (
        fallback || (
          <FallbackIcon
            className={cn(imageClassName, { [failedClassName]: failed && failedClassName })}
          />
        )
      ) : (
        <img
          src={src}
          draggable="false"
          alt={alt}
          style={{ maxWidth: size, maxHeight: size }}
          onError={() => setFailed(true)}
          className={cn(imageClassName, { [failedClassName]: failed && failedClassName })}
        />
      )}
    </div>
  )
}

export default React.memo(Image)
