import './Loading.scss';

const Skeleton = ({children}) => {
    return (
        <div className="Skeleton">
            <div className="">
                {children}
            </div>
        </div>
    );
};

export default Skeleton;