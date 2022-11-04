import React from 'react'
import { ErrorScreen, ChunkErrorScreen } from 'components/common'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    console.log(error)
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  render() {
    const { error, hasError } = this.state

    if (!hasError) return this.props.children

    // A chunck(s) failed to load. This may happen because: 1) The app has just
    // been updated, or 2) The internat connection got lost
    // {@link https://stackoverflow.com/a/62284335/1333836}
    const hasChunkFailedToLoad = error.name === 'ChunkLoadError'

    return !hasChunkFailedToLoad ? <ChunkErrorScreen /> : <ErrorScreen />
  }
}

export default ErrorBoundary
