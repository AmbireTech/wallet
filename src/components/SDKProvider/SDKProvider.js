import { createContext, useContext, useState } from 'react'

import { useModals } from 'hooks'
import CloseSDKModal from 'components/SDK/SDKWrapper/CloseModal/CloseModal'

import { ReactComponent as AmbireLogoIcon } from 'resources/logo.svg'
import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'

import styles from './SDKProvider.module.scss'

const SDKContext = createContext({})

const SDKProvider = ({ children }) => {
  const { showModal } = useModals()
  const [isBackButtonVisible, setIsBackButtonVisible] = useState(true)
  const [dappQuery, setDappQuery] = useState(false)
  const [isSDK, setIsSDK] = useState(false)

  const showCloseModal = () => showModal(<CloseSDKModal />)

  return (
    <SDKContext.Provider value={{ setIsBackButtonVisible, dappQuery, setDappQuery, isSDK, setIsSDK }}>
      {isSDK ? (
        <div className={styles.wrapper}>
          <div className={styles.headerAndBody}>
            <div className={styles.header}>
              {isBackButtonVisible ? (
                <div className={styles.backButton} onClick={showCloseModal}>
                  <ChevronLeftIcon className={styles.backButtonIcon} />
                  <p className={styles.backButtonText}>Back to dApp</p>
                </div>
              ) : null}
              {/* @TODO: add a fallback icon */}
              <img src={`${document.referrer}/favicon.png`} alt="" className={styles.dappLogo} />
            </div>
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
