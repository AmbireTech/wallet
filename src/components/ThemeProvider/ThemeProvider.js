import { createContext, useEffect, useState } from 'react'
// For testing purposes, you can use the following code to test the SDK
import BuyCrypto from 'components/SDK/BuyCrypto/BuyCrypto'
import SDK from 'components/SDK/SDK'
import SwitchNetwork from 'components/SDK/SwitchNetwork/SwitchNetwork'

import styles from './ThemeProvider.module.scss'

const ThemeContext = createContext(null)

const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState('light')

	useEffect(() => {
		document.documentElement.className = styles[theme || 'dark']
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{theme === 'light' ? (
				<SDK>
					<SwitchNetwork />
				</SDK>
			) : (children)}
		</ThemeContext.Provider>
	)
}

export default ThemeProvider
