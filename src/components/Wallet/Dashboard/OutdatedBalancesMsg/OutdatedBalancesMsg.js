const OutdatedBalancesMsg = ({ selectedAccount, selectedNetwork }) => {
    return (
        <div className="notification-hollow warning">
            <h4>Dashboard balances could appear incomplete or outdated.</h4>
            <p>
            We are currently experiencing technical difficulties with our third party services, so what you see on the dashboard may be incomplete or outdated. You can check <a href={selectedNetwork.explorerUrl+'/address/'+ selectedAccount} target='_blank' rel='noreferrer'>{selectedNetwork.explorerUrl.split('/')[2]}</a> to see your current balances. However, you can use Ambire normally with any connected dApp.
            </p>
        </div>
    )
}

export default OutdatedBalancesMsg