/* eslint-disable import/no-cycle */
import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'

import { ReactComponent as DepositIcon } from 'components/Wallet/SideBar/images/deposit.svg'

import styles from './NoFundsPlaceholder.module.scss'

const NoFundsPlaceholder = () => {
  return (
    <div className={styles.wrapper}>
      <p className={styles.text}>You don&apos;t have any funds on this account.</p>
      <NavLink to="/wallet/deposit">
        <Button size="sm" startIcon={<DepositIcon />}>
          Deposit
        </Button>
      </NavLink>
    </div>
  )
}

export default NoFundsPlaceholder
