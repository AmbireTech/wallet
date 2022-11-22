import './NoFundsPlaceholder.scss'

import { GiReceiveMoney } from 'react-icons/gi'
import { NavLink } from 'react-router-dom'
import { Button } from 'components/common'

const NoFundsPlaceholder = () => {
    return (
        <div id="no-funds-placeholder">
            <label>You don't have any funds on this account.</label>
            <NavLink to="/wallet/deposit">
                <Button small icon={<GiReceiveMoney/>}>Deposit</Button>
            </NavLink>
        </div>
    )
}

export default NoFundsPlaceholder