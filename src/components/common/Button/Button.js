import styles from './Button.module.scss'

const Button = ({ children, className, small, mini, icon, iconAfter, disabled, onClick, red, primaryGradient, danger, clear, border, title, type, textOnly, secondary }) => {
    return (
        <button
            onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
            className={`${styles.wrapper} ${className} ${small ? styles.small : ''} ${mini ? styles.mini : ''} ${primaryGradient ? styles.primaryGradient : ''} ${danger || red ? styles.danger : ''} ${clear ? styles.clear : ''} ${border ? styles.border : ''} ${disabled ? styles.disabled : ''} ${textOnly ? styles.textOnly : ''} ${secondary ? styles.secondary : ''}`}
            // disabled={disabled} // causing pointer-events to not trigger 
            title={title}
            // used with <form>
            type={type}
        >
            { icon ? <div className={styles.iconButton}>{ icon }</div> : null }
            { children }
            { iconAfter ? <div className={styles.iconButton}>{ iconAfter }</div> : null }
        </button>
    )
}

export default Button
