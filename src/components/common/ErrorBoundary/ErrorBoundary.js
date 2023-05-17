/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/no-cycle */
import React from 'react'
import { ErrorScreen } from 'components/common'

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

  render() {
    // In case of error, show a helpful UI
    if (this.state.hasError) {
      return <ErrorScreen />
    }

    return this.props.children
  }
}

export default ErrorBoundary
