import { createContext, useEffect, useState } from 'react'

import styles from './ThemeProvider.module.scss'

const ThemeContext = createContext(null)

const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState('light')

	useEffect(() => {
		document.documentElement.className = styles[theme]
	}, [theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			<div>{children}</div>
		</ThemeContext.Provider>
	)
}

export default ThemeProvider
