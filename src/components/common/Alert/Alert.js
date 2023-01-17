import cn from 'classnames'

import { ReactComponent as InformationIcon } from './images/information.svg'
import { ReactComponent as SuccessIcon } from './images/success.svg'
import { ReactComponent as WarningIcon } from './images/warning.svg'
import { ReactComponent as DangerIcon } from './images/danger.svg'
import { ReactComponent as DegenTipIcon } from 'resources/icons/degen-tip.svg'

import styles from './Alert.module.scss'

const icons = {
  danger: <DangerIcon />,
  warning: <WarningIcon />,
  success: <SuccessIcon />,
  info: <InformationIcon />,
  degenTip: <DegenTipIcon />
}

const Alert = ({ title, text, type, size, iconNextToTitle, className }) => {
  const icon = icons[type] || icons.info

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.alertWrapper}>
        <div className={cn(styles.alert, styles[type || "info"], styles[size || "normal"], {[styles.alertIconNextToTitle] : iconNextToTitle})}>
          {iconNextToTitle ? null : icon}
          <div className={styles.body}>
            <div className={styles.titleWrapper}>
              {iconNextToTitle ? icon : null}
              <h4 className={styles.title}>{title}</h4>
            </div>
            {text ? <p className={styles.text}>{text}</p> : null}
          </div>
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  )
}

export default Alert
