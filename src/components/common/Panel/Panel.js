import cn from 'classnames'
import styles from './Panel.module.scss'

const Panel = ({ id, title, children, className, titleClassName }) => {
  return (
    <div id={id} className={cn(styles.wrapper, className || '')}>
      {title && <h2 className={cn(styles.title, titleClassName || '')}>{title}</h2>}
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Panel
