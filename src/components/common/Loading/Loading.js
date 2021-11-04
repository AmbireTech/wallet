import './Loading.scss';

import { AiOutlineLoading } from 'react-icons/ai';

const Loading = () => {
    return (
        <div className="loading">
            <div className="icon">
                <AiOutlineLoading size={35}/>
            </div>
        </div>
    );
};

export default Loading;