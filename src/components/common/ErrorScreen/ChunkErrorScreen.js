import './ErrorScreen.scss'
import { Button } from 'components/common'

const ChunkErrorScreen = () => {
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
        <h1>The Ambire app has been updated ✅</h1>
        <p>Please <a href="/" className="error-screen-content-refresh-btn" onClick={refresh}>refresh</a> to see the latest content.</p>
        <p>If your attempt to refresh takes you to back here,<br />please contact us via our <a href="https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet" target="_blank" rel="noreferrer">Help Center</a>.</p>
      </div>
    </div>
  )
}

export default ChunkErrorScreen
