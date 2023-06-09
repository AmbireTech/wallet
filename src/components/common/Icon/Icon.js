import cn from 'classnames'

import styles from './Icon.module.scss'

const Icon = ({ children, className, size, noBackground }) => (
  <div
    className={cn(styles.wrapper, className, styles[size || ''], {
      [styles.noBackground]: noBackground
    })}
  >
    {children}
  </div>
)

export default Icon
