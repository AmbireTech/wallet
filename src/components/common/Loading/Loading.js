import './Loading.scss';

import { AiOutlineLoading } from 'react-icons/ai';

const Loading = ({size = 35}) => {
    return (
        <div className="loading">
            <div className="icon">
                <AiOutlineLoading size={size}/>
            </div>
        </div>
    );
};

export default Loading;
