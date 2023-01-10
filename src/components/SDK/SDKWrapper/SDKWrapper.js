import { useLayoutEffect, useEffect } from 'react'
import { Switch, Route } from 'react-router-dom'

import { useThemeContext } from 'components/ThemeProvider/ThemeProvider'

import { ReactComponent as AmbireLogoIcon } from 'resources/logo.svg'

import styles from './SDKWrapper.module.scss'
import getRoutes from './helpers/getRoutes'

// const SDKContext = createContext({isSDK: true})
// export const useSDKContext = () => useContext(SDKContext)

const SDK = (props) => {
  const { setTheme } = useThemeContext()
  const routes = getRoutes(props)

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

  return (
    // <SDKContext.Provider value={{ isHeaderVisible, setIsHeaderVisible }}>
    <div className={styles.wrapper}>
      <div className={styles.headerAndBody}>
        <div className={styles.header}>
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
    // </SDKContext.Provider>
  )
}

export default SDK
