import './Toggle.scss'

const Toggle = ({ defaultChecked, checked, onChange }) => {
    return (
        <label className="toggle">
            <input type="checkbox" defaultChecked={defaultChecked} checked={checked} onChange={onChange}/>
            <span className="slider"></span>
        </label>
    )
}

export default Toggle