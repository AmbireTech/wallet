import './Button.scss'

const Button = ({ children, small, icon, disabled }) => {
    return (
        <button className={`buttonComponent ${small ? 'small' : ''}`} disabled={disabled}>
            <div className="icon">{ icon }</div>
            { children }
        </button>
    )
}

export default Button
