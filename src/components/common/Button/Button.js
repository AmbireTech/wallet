import './Button.scss'

const Button = ({ children, className, small, icon, iconAfter, disabled, onClick, red, danger, clear, border, title, type }) => {
    return (
        <button
            onClick={() => !disabled && onClick && onClick()}
            className={`buttonComponent ${className} ${small ? 'small' : ''} ${danger || red ? 'danger' : ''} ${clear ? 'clear' : ''} ${border ? 'border' : ''} ${disabled ? 'disabled' : ''}`}
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
