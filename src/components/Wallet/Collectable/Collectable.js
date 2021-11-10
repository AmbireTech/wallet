import './Collectable.scss'

import { useParams } from 'react-router-dom'

const Collectable = () => {
    const { network, collectionAddr, tokenId } = useParams()
    console.log(network);
    console.log(collectionAddr);
    console.log(tokenId);
    return (
        <div id="collectable">
            <div className="panel">
                
            </div>
            <div className="panel">
                
            </div>
        </div>
    )
}

export default Collectable