import cn from 'classnames'
import styles from './Token.module.scss'
import { Image } from 'components/common'
import { getTokenIcon } from 'lib/icons'

const Token = ({ name, address, network, icon, className, children }) => (
  <div className={cn(styles.wrapper, className)}>
    <div className={styles.info}>
      <div className={styles.iconWrapper}>
        <Image
          src={icon || getTokenIcon(network, address)}
          alt=""
          size="22px"
          imageClassName={styles.innerImage}
          failedClassName={styles.failedIcon}
        />
      </div>
      <h3 className={styles.name}>
        { name }
        {' '}
        <span>
          ({ network })
        </span>
      </h3>
    </div>
    { children }
  </div>
)

export default Token