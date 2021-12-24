import './Alert.scss'

const Alert = ({ children, className, title, icon, iconAfter, disabled, onClick, variant, }) => {
    return (
        <div
            onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
            className={`alert ${variant} ${className} ${!!onClick && 'clickable'}`}
        >
            { title && 
                <div className='title'>{title} </div>
            }
            <div class='content'>
                { icon ? <div className="icon">{ icon }</div> : null }
                { children }
                { iconAfter ? <div className="icon after">{ iconAfter }</div> : null }
            </div>
        </div>
    )
}

export default Alert
