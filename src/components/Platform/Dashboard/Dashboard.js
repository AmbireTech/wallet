import './Dashboard.css'

import Deposit from './Deposit/Deposit'

export default function Dashboard({ selectedAcc }) {
    return (
        <section id="dashboard">
            <div id="dashboardArea">
              <Deposit depositAddress={selectedAcc}></Deposit>
            </div>
        </section>
    )
}