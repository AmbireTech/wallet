import './Button.scss'

const Button = ({ children, small, icon, disabled, onClick, red }) => {
    return (
        <button onClick={onClick} className={`buttonComponent ${small ? 'small' : ''} ${red ? 'red' : ''}`} disabled={disabled}>
            {icon && <div className="icon">{ icon }</div>}
            { children }
        </button>
    )
}

export default Button
