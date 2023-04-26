import cn from 'classnames'

import { Radios } from 'components/common'
import Route from './Route/Route'

import { ReactComponent as RoutesIcon } from './images/routes.svg'

import styles from './Routes.module.scss'

const Routes = ({ routes, setSelectedRoute }) => {
  const radios = routes.map((route) => ({
    label: <Route data={route} />,
    value: route.routeId
  }))

  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.titleWrapper, { [styles.noRoutes]: !radios.length })}>
        <RoutesIcon />
        <h2 className={styles.title}>Choose a Route</h2>
      </div>

      {!radios.length ? (
        <p className={styles.noRoutesPlaceholder}>
          There is no routes available for this configuration at the moment. Try increasing the
          amount or switching token.
        </p>
      ) : (
        <Radios
          radios={radios}
          onChange={(value) => setSelectedRoute(value)}
          radioClassName={styles.route}
          className={styles.routes}
        />
      )}
    </div>
  )
}

export default Routes
