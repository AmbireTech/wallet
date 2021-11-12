import './Button.scss'

const Button = ({ children, small, icon, disabled, onClick }) => {
    return (
        <button className={`buttonComponent ${small ? 'small' : ''}`} disabled={disabled} onClick={onClick}>
            <div className="icon">{ icon }</div>
            { children }
        </button>
    )
}

export default Button
