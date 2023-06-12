import cn from 'classnames'

import { ReactComponent as XIcon } from 'resources/icons/x.svg'
import { ReactComponent as CheckIcon } from 'resources/icons/check.svg'

import styles from './PasswordStrength.module.scss'

const PasswordStrength = ({ passwordStrength, hasPassword, isFocused, className }) => {
  return (
    <div
      className={cn(styles.passwordStrength, className, {
        [styles.visible]: hasPassword && isFocused
      })}
    >
      {passwordStrength.checks.map((check) => (
        <div key={check.id} className={styles.check}>
          {check.satisfied ? (
            <CheckIcon className={styles.checkIcon} />
          ) : (
            <XIcon className={styles.xIcon} />
          )}
          <span className={styles.checkLabel}>{check.label}</span>
        </div>
      ))}
    </div>
  )
}

export default PasswordStrength
