import './Button.scss'

const Button = ({ children, className, small, mini, icon, iconAfter, disabled, onClick, red, danger, clear, border, title, type }) => {
    return (
        <button
            onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
            className={`buttonComponent ${className} ${small ? 'small' : ''} ${mini ? 'mini' : ''} ${danger || red ? 'danger' : ''} ${clear ? 'clear' : ''} ${border ? 'border' : ''} ${disabled ? 'disabled' : ''}`}
            // disabled={disabled} // causing pointer-events to not trigger 
            title={title}
            // used with <form>
            type={type}
        >
            { icon ? <div className="icon-button">{ icon }</div> : null }
            { children }
            { iconAfter ? <div className="icon-button">{ iconAfter }</div> : null }
        </button>
    )
}

export default Button
