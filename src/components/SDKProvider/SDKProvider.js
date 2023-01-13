import { createContext, useContext, useState } from 'react'

import { useModals } from 'hooks'
import { Image } from 'components/common'
import CloseSDKModal from 'components/SDK/CloseModal/CloseModal'

import { ReactComponent as AmbireLogoIcon } from './images/ambire-logo.svg'
import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as DappFallbackIcon } from 'components/SDK/images/dapp-fallback.svg'

import styles from './SDKProvider.module.scss'

const SDKContext = createContext({})

const SDKProvider = ({ children }) => {
	const { showModal } = useModals()
	const [isBackButtonVisible, setIsBackButtonVisible] = useState(true)
	const [isHeaderVisible, setIsHeaderVisible] = useState(true)
	const [dappQuery, setDappQuery] = useState(false)
	const [isSDK, setIsSDK] = useState(false)

	const showCloseModal = () => showModal(<CloseSDKModal />)

	return (
		<SDKContext.Provider value={{ setIsBackButtonVisible, setIsHeaderVisible, dappQuery, setDappQuery, isSDK, setIsSDK }}>
			{isSDK ? (
				<div className={styles.wrapper}>
					<div className={styles.headerAndBody}>
						{isHeaderVisible ? <div className={styles.header}>
							{isBackButtonVisible ? (
								<div className={styles.backButton} onClick={showCloseModal}>
									<ChevronLeftIcon className={styles.backButtonIcon} />
									<p className={styles.backButtonText}>Back to dApp</p>
								</div>
							) : null}
							<Image
								src={`${document.referrer}/favicon.png`}
								alt=""
								className={styles.dappLogo}
								size={32}
								fallback={<DappFallbackIcon />}
							/>
						</div> : null}
						<div className={styles.body}>{children}</div>
					</div>
					<div className={styles.footer}>
						<p className={styles.footerText}>Powered by Ambire Wallet</p>
						<AmbireLogoIcon className={styles.footerLogo} />
					</div>
				</div>
			) : (
				children
			)}
		</SDKContext.Provider>
	)
}

export const useSDKContext = () => useContext(SDKContext)

export default SDKProvider
