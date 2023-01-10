import { createContext, useContext, useLayoutEffect, useState } from 'react'
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
		</ThemeContext.Provider>
	)
}

export const useThemeContext = () => useContext(ThemeContext)

export default ThemeProvider
