import { Radios } from 'components/common'
import Route from './Route/Route'

import styles from './Routes.module.scss'

const Routes = ({ routes, setSelectedRoute }) => {
  const radios = routes.map((route) => ({
    label: <Route data={route} />,
    value: route.routeId,
  }))

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>Routes</div>
      {!radios.length ? (
        <div className={styles.noRoutesPlaceholder}>
          There is no routes available for this configuration at the moment.
          <br />
          Try increasing the amount or switching token.
        </div>
      ) : (
        <Radios radios={radios} onChange={(value) => setSelectedRoute(value)} radioClassName={styles.route} />
      )}
    </div>
  )
}

export default Routes
