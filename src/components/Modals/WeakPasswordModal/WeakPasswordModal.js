import React from 'react'

import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'

import styles from './WeakPasswordModal.module.scss'

export default function WeakPasswordModal({ onContinueAnyway }) {
	const { hideModal } = useModals()

	const handleContinueAnyway = () => {
		if (onContinueAnyway) onContinueAnyway()
		hideModal()
	}

	return (
		<Modal
			size="sm"
			className={styles.wrapper}
			isCloseBtnShown={false}
			title="Your password is weak"
			buttons={
				<>
					<Button border onClick={hideModal} className={styles.button}>
						Go back
					</Button>
					<Button danger onClick={handleContinueAnyway} className={styles.button}>
						Continue anyway
					</Button>
				</>
			}>
			<p>
				The password you are trying to use has been found in a data breach. We strongly recommend you to use a different
				password.
			</p>
		</Modal>
	)
}
