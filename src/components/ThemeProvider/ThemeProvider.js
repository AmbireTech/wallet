// For testing purposes, you can use the following code to test the SDK
// import BuyCrypto from 'components/SDK/BuyCrypto/BuyCrypto'
// import SDK from 'components/SDK/SDK'
// import SwitchNetwork from 'components/SDK/SwitchNetwork/SwitchNetwork'
import { createContext, useEffect, useState } from 'react'

import styles from './ThemeProvider.module.scss'

const ThemeContext = createContext(null)

const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState('dark')

	useEffect(() => {
		document.documentElement.className = styles[theme || 'dark']
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export default ThemeProvider
