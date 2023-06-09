import React from 'react'
import ReactDOM from 'react-dom'
// If we want any other Poppins style/weight, we should import it manually here, i.e.:
// import '@fontsource/poppins/600.css'
import '@fontsource/poppins' // Defaults to weight 400.
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/500.css'
import '@fontsource/ubuntu-mono' // Defaults to weight 400.
import '@fontsource/ubuntu-mono/700.css'
import App from './App'
import { ErrorBoundary } from './components/common'
import reportWebVitals from './reportWebVitals'

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
