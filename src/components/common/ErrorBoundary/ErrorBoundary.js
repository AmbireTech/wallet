import React from 'react'
import './ErrorBoundary.scss'
import { Button } from 'components/common'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    console.log(error)
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  refresh(e) {
    e.preventDefault()
    window.location.reload(true)
  }

  render() {
    // In case of error, show a helpful UI
    if (this.state.hasError) {
      return <div className="error-boundary">
        <div className="error-boundary-content panel">
          <a href={window.location.origin}>
            <div className="logo" />
          </a>
          <h1>Something went wrong, but your funds are safe!</h1>
          <p>Please, try to <a href="/" className="error-boundary-content-refresh-btn" onClick={this.refresh}>refresh</a> the current page.</p>
          <p>If the problem persists,<br />please contact us via our Help Center.</p>
          <div className="error-boundary-buttons">
            <a href="https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet" target="_blank" rel="noreferrer">
              <Button title="Visit the Help center" small>Help center</Button>
            </a>
          </div>
        </div>
      </div>
    }

    return this.props.children
  }
}

export default ErrorBoundary
