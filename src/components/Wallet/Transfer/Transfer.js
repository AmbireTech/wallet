import './Transfer.scss'

import { AiOutlineArrowDown } from 'react-icons/ai'
import { BsBoxArrowInDown, BsBoxArrowUp } from 'react-icons/bs'
import { TextInput, Segments, Button } from '../../common'

const Transfer = () => {
    const segments = [
        {
            value: 'Deposit',
            icon: <BsBoxArrowInDown/>
        },
        {
            value: 'Withdraw',
            icon: <BsBoxArrowUp/>
        }
    ]

    return (
        <div id="transfer">
           <div className="panel">
               <div className="title">
                   Send
               </div>
               <div className="form">
                    <TextInput placeholder="Asset"/>
                    <TextInput placeholder="Amount" button="MAX"/>
                    <TextInput placeholder="Recipient" info="Please double-check the recipient address, blockchain transactions are not reversible."/>
                    <div className="separator"/>
                    <Button>Send</Button>
                </div>
           </div>
           <div className="panel">
               <div className="overlay">
                    Coming Soon...
               </div>
               <div className="title">
                   Cross-chain
               </div>
               <div className="form">
                    <Segments defaultValue={segments[0].value} segments={segments}/>
                    <TextInput placeholder="From"/>
                    <div className="separator">
                        <AiOutlineArrowDown/>
                    </div>
                    <TextInput placeholder="To"/>
                    <Button>Transfer</Button>
                </div>
           </div>
        </div>
    )
}

export default Transfer