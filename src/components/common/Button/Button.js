import './Button.scss'

const Button = ({ children, small, icon, disabled, onClick, red, clear, title }) => {
    return (
        <button onClick={onClick} className={`buttonComponent ${small ? 'small' : ''} ${red ? 'red' : ''} ${clear ? 'clear' : ''}`} disabled={disabled} title={title}>
            { icon ? <div className="icon-button">{ icon }</div> : null }
            { children }
        </button>
    )
}

export default Button
