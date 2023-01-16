import { useLayoutEffect } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'

import getRoutes from './helpers/getRoutes'

import { useSDKContext } from 'components/SDKProvider/SDKProvider'

const SDK = (props) => {
  const { location } = useLocation()
  const { setIsBackButtonVisible, setIsHeaderVisible } = useSDKContext()

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
