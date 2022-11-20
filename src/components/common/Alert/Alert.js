import cn from 'classnames'

import { ReactComponent as InformationIcon } from './images/information.svg'
import { ReactComponent as SuccessIcon } from './images/success.svg'
import { ReactComponent as WarningIcon } from './images/warning.svg'
import { ReactComponent as DangerIcon } from './images/danger.svg'

import styles from './Alert.module.scss'

const icons = {
  danger: <DangerIcon />,
  warning: <WarningIcon />,
  success: <SuccessIcon />,
  info: <InformationIcon />
}

const Alert = ({ title, text, type, iconNextToTitle, className }) => {
  const icon = icons[type] || icons.info

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.alertWrapper}>
        <div className={cn(styles.alert, styles[type || 'info'], styles.alertIconNextToTitle)}>
          {iconNextToTitle ? null : icon}
          <div className={styles.body}>
            <div className={styles.titleWrapper}>
              {iconNextToTitle ? icon : null}
              <h4 className={styles.title}>{title}</h4>
            </div>
            <p className={styles.text}>{text}</p>
          </div>
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  )
}

export default Alert
