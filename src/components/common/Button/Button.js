import './Button.scss'

const Button = ({ children }) => {
    return (
        <button className='buttonComponent'>
            { children }
        </button>
    )
}

export default Button
