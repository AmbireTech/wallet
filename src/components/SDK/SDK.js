import { useLayoutEffect, useEffect } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'

import getRoutes from './helpers/getRoutes'

import { useThemeContext } from 'components/ThemeProvider/ThemeProvider'
import { useSDKContext } from 'components/SDKProvider/SDKProvider'

const SDK = (props) => {
  const { location } = useLocation()
  const { setTheme } = useThemeContext()
  const { setIsBackButtonVisible, setIsHeaderVisible, setIsSDK, isSDK } = useSDKContext()

  // sets the theme to light only on SDK
  useLayoutEffect(() => {
    setTheme('light')
    setIsSDK(true)
  }, [setTheme, setIsSDK])

  // This curves the modal
  useEffect(() => {
    if (isSDK) {
      const borderRadiusStyle = 'border-radius: 12px; overflow: hidden; background: unset;'

      const html = document.querySelector('html')
      const body = document.querySelector('body')
      html.style = borderRadiusStyle
      body.style = borderRadiusStyle
    }
  }, [isSDK])

  useLayoutEffect(() => {
    setIsBackButtonVisible(true)
    setIsHeaderVisible(true)
  }, [location, setIsBackButtonVisible, setIsHeaderVisible])
  
  return (
    <Switch>
      {getRoutes(props).map(({ path, component }) => (
        <Route exact path={props.match.url + path} key={path}>
          {component ? component : null}
        </Route>
      ))}
    </Switch>
  )
}

export default SDK
