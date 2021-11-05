import { useState } from 'react'
import './Segments.scss'

const Segments = ({ defaultValue, segments }) => {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="segments">
            {
                segments.map(segment => (
                    <div className={`segment ${segment.value === value ? 'active' : ''}`} key={segment.value} onClick={() => setValue(segment.value)}>
                        <div className="icon">{ segment.icon }</div>
                        { segment.value }
                    </div>
                ))
            }
        </div>
    )
}

export default Segments