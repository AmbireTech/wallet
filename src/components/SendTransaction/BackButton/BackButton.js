import cn from 'classnames'

import { ToolTip } from 'components/common'

import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as InfoIcon } from 'resources/icons/information.svg'

import styles from './BackButton.module.scss'

const BackButton = ({ onDismiss }) => (
  <div className={styles.wrapper}>
    <div className={styles.row}>
      <div onClick={onDismiss} className={cn(styles.row, styles.dismiss)}>
        <div className={styles.backIcon}>
          <ChevronLeftIcon />
        </div>
        <p className={styles.backLabel}>Back</p>
      </div>
      <ToolTip label="You can go back to the main dashboard and add more transactions to this bundle in order to sign & send them all at once.">
        <InfoIcon className={styles.infoIcon} />
      </ToolTip>
    </div>
  </div>
)

export default BackButton
