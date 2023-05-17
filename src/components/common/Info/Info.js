import cn from 'classnames'

import { ReactComponent as InfoIcon } from 'resources/icons/information.svg'
import styles from './Info.module.scss'

const Info = ({ className, children }) => (
  <div className={cn(styles.wrapper, className)}>
    <InfoIcon className={styles.icon} />
    <p className={styles.text}>{children}</p>
  </div>
)

export default Info
