import { useState } from 'react'
import './Segments.scss'

const Segments = ({ defaultValue, segments }) => {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="segments">
            {
                segments.map(segment => (
                    <div className={`segment ${segment === value ? 'active' : ''}`} key={segment} onClick={() => setValue(segment)}>
                        { segment }
                    </div>
                ))
            }
        </div>
    )
}

export default Segments