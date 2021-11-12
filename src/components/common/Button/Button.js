import './Button.scss'

const Button = ({ children, small, icon, disabled, onClick }) => {
    return (
        <button className={`buttonComponent ${small ? 'small' : ''}`} disabled={disabled} onClick={onClick}>
            { icon ? <div className="icon-button">{ icon }</div> : null }
            { children }
        </button>
    )
}

export default Button
