import cn from 'classnames'

import styles from './ResponsiveAddress.module.scss'

const ResponsiveAddress = ({ address, className }) =>
  address.length ? (
    <p className={cn(styles.wrapper, className)}>
      <span className={styles.firstPart}>{address.substring(0, address.length - 3)}</span>
      {address.substring(address.length - 3, address.length)}
    </p>
  ) : null

export default ResponsiveAddress
