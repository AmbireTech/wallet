import cn from 'classnames'
import { FC } from 'react'

import { AiOutlineLoading } from 'react-icons/ai'

import { ButtonProps } from './types'

import styles from './Button.module.scss'

const Button: FC<ButtonProps> = ({
	variant = 'primary',
	size,
	loading,
	startIcon,
	endIcon,
	disabled,
	onClick,
	className,
	children,
	title,
	type,
	form,
	loadingText,
	testId
}) => {
	return (
		<button
			onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
			className={cn(
				styles.wrapper,
				styles[variant],
				{
					[styles.disabled]: disabled || loading,
					[styles.loading]: loading,
          [styles[size || '']]: size 
				},
				className
			)}
			disabled={disabled}
			title={title}
			// used with <form>
			type={type}
			form={form}
			data-testid={testId}
		>
			{(!loading && startIcon) && startIcon}
			{!loading ? (
				children
			) : (
				<div className={styles.loadingInner}>
					<AiOutlineLoading />
					<p className={styles.loadingText}>{loadingText || 'Loading...'}</p>
				</div>
			)}
			{(!loading && endIcon) && endIcon}
		</button>
	)
}

export default Button
