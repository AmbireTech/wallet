import { useLayoutEffect, useEffect, createContext, useContext, useState } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'

import getRoutes from './helpers/getRoutes'

import { useModals } from 'hooks'
import { useThemeContext } from 'components/ThemeProvider/ThemeProvider'
import CloseSDKModal from './CloseModal/CloseModal'

import { ReactComponent as AmbireLogoIcon } from 'resources/logo.svg'
import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'

import styles from './SDKWrapper.module.scss'

const SDKContext = createContext({})
export const useSDKContext = () => useContext(SDKContext)

const SDK = (props) => {
  const { location } = useLocation()
  const { showModal } = useModals()
  const { setTheme } = useThemeContext()
  const [isBackButtonVisible, setIsBackButtonVisible] = useState(true)
  const [dappQuery, setDappQuery] = useState(false)

  // sets the theme to light only on SDK
  useLayoutEffect(() => {
    setTheme('light')
  }, [setTheme])

  // This curves the modal
  useEffect(() => {
    const borderRadiusStyle = 'border-radius: 12px; overflow: hidden; background: unset;'

    const html = document.querySelector('html')
    const body = document.querySelector('body')
    html.style = borderRadiusStyle
    body.style = borderRadiusStyle
  }, [])

  const showCloseModal = () => showModal(<CloseSDKModal />)

  const routes = getRoutes(props)

  useLayoutEffect(() => {
    setIsBackButtonVisible(true)
  }, [location])

  return (
    <SDKContext.Provider value={{ setIsBackButtonVisible, dappQuery, setDappQuery }}>
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
          <div className={styles.body}>
            <Switch>
              {routes.map(({ path, component }) => (
                <Route exact path={props.match.url + path} key={path}>
                  {component ? component : null}
                </Route>
              ))}
            </Switch>
          </div>
        </div>
        <div className={styles.footer}>
          <p className={styles.footerText}>Powered by Ambire Wallet</p>
          <AmbireLogoIcon className={styles.footerLogo} />
        </div>
      </div>
    </SDKContext.Provider>
  )
}

export default SDK
