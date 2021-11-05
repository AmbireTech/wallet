import './Transfer.scss'

import { AiOutlineArrowDown } from 'react-icons/ai'
import { TextInput, Segments, Button } from '../../common'

const Transfer = () => {
    const segments = [
        'Deposit',
        'Withdraw'
    ]

    return (
        <div id="transfer">
           <div className="panel">
               <div className="title">
                   Send
               </div>
               <form action="">
                    <TextInput placeholder="Asset"/>
                    <TextInput placeholder="Amount"/>
                    <TextInput placeholder="Recipient"/>
                </form>
           </div>
           <div className="panel">
               <div className="overlay">
                    Coming Soon...
               </div>
               <div className="title">
                   Cross-chain
               </div>
               <form action="">
                    <Segments defaultValue={segments[0]} segments={segments}/>
                    <TextInput placeholder="From"/>
                    <div className="separator">
                        <AiOutlineArrowDown/>
                    </div>
                    <TextInput placeholder="To"/>
                    <Button>Transfer</Button>
                </form>
           </div>
        </div>
    )
}

export default Transfer