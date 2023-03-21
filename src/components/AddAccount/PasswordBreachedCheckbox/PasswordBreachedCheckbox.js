import { ReactComponent as AlertCircle } from 'resources/icons/alert-circle.svg'
import styles from './PasswordBreachedCheckbox.module.scss'

const PasswordBreachedCheckbox = ({ isPasswordBreachedChecked, setIsPasswordBreachedChecked }) => (
	<div className={styles.wrapper}>
    <div className={styles.passwordBreachedWarningWrapper}>
      <AlertCircle className={styles.passwordBreachedWarningIcon} />
      <p className={styles.passwordBreachedWarningText}>
        This password has been found in a data breach and should not be used.
      </p>
    </div>
		<div className={styles.passwordBreachedCheckboxWrapper}>
			<input
				type="checkbox"
				value={isPasswordBreachedChecked}
				onChange={() => setIsPasswordBreachedChecked((prev) => !prev)}
				className={styles.passwordBreachedCheckbox}
				id="password-breached-checkbox"
			/>
			<label htmlFor="password-breached-checkbox" className={styles.passwordBreachedLabel}>
				I accept the risk and want to use this password anyway
			</label>
		</div>
	</div>
)

export default PasswordBreachedCheckbox
