import React from 'react'
import cn from 'classnames'
import styles from './Panel.module.scss'

const Panel = ({ id, title, children, className, titleClassName }) => {
  return (
    <div id={id} className={cn(styles.wrapper, className || '')}>
      {title && <div className={cn(styles.title, titleClassName || '')}>{title}</div>}
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Panel
