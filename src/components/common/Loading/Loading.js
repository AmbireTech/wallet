import cn from 'classnames'
import './Loading.scss';

import { AiOutlineLoading } from 'react-icons/ai';

const Loading = ({className}) => {
    return (
        <div className={cn("loading", className)}>
            <div className="icon">
                <AiOutlineLoading size={35}/>
            </div>
        </div>
    );
};

export default Loading;