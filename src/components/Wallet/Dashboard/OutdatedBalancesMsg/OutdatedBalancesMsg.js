const OutdatedBalancesMsg = ({ selectedAccount, selectedNetwork }) => {
    return (
        <div className="notification-hollow warning">
            <h4>Dashboard balances could be incomplete or outdated.</h4>
            <p>
                We are currently experiencing technical difficulties with our balances service, so what you see in the dashboard may be incomplete or outdated. You can use the <a href={selectedNetwork.explorerUrl+'/address/'+ selectedAccount} target='_blank' rel='noreferrer'>{selectedNetwork.explorerUrl.split('/')[2]}</a> to see your current balances, and you can use Ambire normally with any connected dApp.
            </p>
        </div>
    )
}

export default OutdatedBalancesMsg