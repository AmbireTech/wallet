import { createContext, useContext, useState } from 'react'
import cn from 'classnames'

import styles from './ThemeProvider.module.scss'

const ThemeContext = createContext(null)

const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState('dark')

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			<div className={cn(styles[theme], styles.wrapper)}>
				{children}
			</div>
		</ThemeContext.Provider>
	)
}

export const useThemeContext = () => useContext(ThemeContext)

export default ThemeProvider
