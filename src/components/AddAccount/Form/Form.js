import cn from 'classnames'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import { Checkbox } from 'components/common'

import styles from './Form.module.scss'

const minPwdLen = 8
const days = Math.ceil(accountPresets.quickAccTimelock / 86400)
const Link = ({ href, children }) => (
	<a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
		{children}
	</a>
)

export default function AddAccountForm({ state, onUpdate, passInput, passConfirmInput, passwordStrength }) {
  const hasPassword = !!state.passphrase.length
  
	return (
		<>
			<div className={styles.passwordInputWrapper}>
				<input
					className={styles.passwordInput}
					type="password"
					ref={passInput}
					required
					minLength={minPwdLen}
					placeholder="Password"
					value={state.passphrase}
					onChange={(e) => onUpdate({ passphrase: e.target.value })}
				/>
				<div className={cn(styles.strengthProgressWrapper, {[styles.taller]: hasPassword})}>
					<div
						className={cn(
							styles.strengthProgress,
							styles[`strengthProgress${hasPassword && passwordStrength(state.passphrase).strength}`]
						)}
					/>
				</div>
			</div>
			<input
				ref={passConfirmInput}
				required
				minLength={minPwdLen}
				type="password"
				placeholder="Confirm password"
				value={state.passphraseConfirm}
				onChange={(e) => onUpdate({ passphraseConfirm: e.target.value })}
			/>
			<Checkbox
				labelClassName={styles.checkboxLabel}
				label={
					<>
						I agree to the{' '}
						<Link href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf">
							Terms of Service and Privacy policy
						</Link>
						.
					</>
				}
				required={true}></Checkbox>
			<Checkbox
				labelClassName={styles.checkboxLabel}
				label={
					<>
						Backup on{' '}
						<Link href="https://help.ambire.com/hc/en-us/articles/4410892186002-What-is-Ambire-Cloud-">
							Ambire Cloud
						</Link>
						.
					</>
				}
				checked={!state.backupOptout}
				onChange={(e) => onUpdate({ backupOptout: !e.target.checked })}></Checkbox>
			{state.backupOptout ? (
				<Checkbox
					label={`In case you forget your password or lose your backup, you will have to wait ${days} days and pay the recovery fee to restore access to your account.`}
					required={true}></Checkbox>
			) : null}
		</>
	)
}
