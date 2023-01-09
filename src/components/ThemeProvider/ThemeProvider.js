import { createContext, useContext, useLayoutEffect, useState } from 'react'
// For testing purposes, you can use the following code to test the SDK
// import BuyCrypto from 'components/SDK/BuyCrypto/BuyCrypto'
// import SDK from 'components/SDK/SDK'
// import SwitchNetwork from 'components/SDK/SwitchNetwork/SwitchNetwork'

import styles from './ThemeProvider.module.scss'

const ThemeContext = createContext(null)

const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState('dark')

	useLayoutEffect(() => {
		document.documentElement.className = styles[theme || 'dark']
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
			{/* For testing purposes, you can use the following code to test the SDK */}
			{/* {theme === 'light' ? (
				<SDK>
					<SwitchNetwork />
				</SDK>
			) : (children)} */}
		</ThemeContext.Provider>
	)
}

export const useThemeContext = () => useContext(ThemeContext)

export default ThemeProvider
