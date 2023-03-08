import styles from './Button.module.scss'

const Button = ({ children, className, small, mini, icon, iconAfter, form, disabled, onClick, red, primaryGradient, secondaryGradient, terniaryGradient, danger, clear, border, title, type, textOnly, secondary, full, testId }) => {
    return (
        <button
            onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
            className={`${styles.wrapper} ${className} ${small ? styles.small : ''} ${mini ? styles.mini : ''} ${primaryGradient ? styles.primaryGradient : ''} ${secondaryGradient ? styles.secondaryGradient : ''} ${terniaryGradient ? styles.terniaryGradient : ''} ${danger || red ? styles.danger : ''} ${clear ? styles.clear : ''} ${border ? styles.border : ''} ${disabled ? styles.disabled : ''} ${textOnly ? styles.textOnly : ''} ${secondary ? styles.secondary : ''} ${full ? styles.full : ''}`}
            disabled={disabled}
            title={title}
            // used with <form>
            type={type}
            form={form}
            data-testid={testId}
        >
            { icon ? <div className={styles.iconButton}>{ icon }</div> : null }
            { children }
            { iconAfter ? <div className={styles.iconButton}>{ iconAfter }</div> : null }
        </button>
    )
}

export default Button
