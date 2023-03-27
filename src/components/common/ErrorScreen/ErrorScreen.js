import './ErrorScreen.scss'
import { Button } from 'components/common'

const ErrorScreen = () => {
  const refresh = (e) => {
    e.preventDefault()
    window.location.reload(true)
  }
  return (
    <div className="error-screen">
      <div className="error-screen-content panel">
        <a href={window.location.origin}>
          <div className="logo" />
        </a>
        <h1>Something went wrong, but your funds are safe!</h1>
        <p>
          Please try to{' '}
          <a href="/" className="error-screen-content-refresh-btn" onClick={refresh}>
            refresh
          </a>{' '}
          the current page.
        </p>
        <p>
          If the problem persists,
          <br />
          please contact us via our Help Center.
        </p>
        <div className="error-screen-buttons">
          <a
            href="https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet"
            target="_blank"
            rel="noreferrer"
          >
            <Button title="Visit the Help center" small>
              Help center
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default ErrorScreen
