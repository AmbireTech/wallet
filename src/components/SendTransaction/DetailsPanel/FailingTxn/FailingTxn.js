import { ToolTip } from "components/common"

import { ReactComponent as ErrorIcon } from 'resources/icons/error.svg'

import styles from './FailingTxn.module.scss'

const FailingTxn = ({ message, tooltip = '' }) => {
  return (
    <div className={styles.wrapper}>
      <ToolTip label={tooltip}>
        <div className={styles.titleWrapper}>
          <ErrorIcon /> 
          <h2 className={styles.title}>Warning</h2>
        </div>
        <p className={styles.text}>{message}</p>
      </ToolTip>
    </div>
  )
}

export default FailingTxn