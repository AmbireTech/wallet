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
