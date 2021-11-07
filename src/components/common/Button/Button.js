import './Button.scss'

const Button = ({ children, small, icon }) => {
    return (
        <button className={`buttonComponent ${small ? 'small' : ''}`}>
            <div className="icon">{ icon }</div>
            { children }
        </button>
    )
}

export default Button
