import './GuardarianDepositProviderModal.scss'

import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import { useEffect, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import useGuardarian from './useGuardarian'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { fetchGet } from 'lib/fetch';
import { popupCenter } from 'lib/popupHelper'
import url from 'url'


const GuardarianDepositProviderModal = ({ relayerURL, walletAddress, selectedNetwork, portfolio }) => {
    
    const { hideModal } = useModals()
    const guardarian = useGuardarian({relayerURL, selectedNetwork, initMode: 'buy', tokens: portfolio.tokens, walletAddress})
    const [validationMsg, setValidationMsg] = useState('')
    const [sendTransactionLoading, setSendTransactionLoading] = useState(false)
    
    function getCurrentTokenFromBalance() {
        if (portfolio.tokens && guardarian?.cryptoCurrencies?.data && guardarian.mode === 'sell') {
            const token = guardarian?.cryptoCurrencies?.data?.find(t => t.ticker === guardarian.from)
            return portfolio?.tokens?.find(t => token?.networks?.find(nt => nt?.token_contract?.toLowerCase() === t?.address?.toLowerCase()))
        }
        else return {}
    }

    function genValidateMessage(){
        if (guardarian.mode === 'buy' && guardarian?.marketInfo?.data){
            if (parseFloat(guardarian.amount) < parseFloat(guardarian.marketInfo.data.min)) return `Minimum amount is ${guardarian.marketInfo.data.min} ${guardarian.marketInfo.data.from}` 
            else if (parseFloat(guardarian.amount) > parseFloat(guardarian.marketInfo.data.max)) return `Maximum amount is ${guardarian.marketInfo.data.max} ${guardarian.marketInfo.data.from}`
            else return ''
        }else if (guardarian.mode === 'sell'){
            const currToken = getCurrentTokenFromBalance()
            if (parseFloat(guardarian.amount) < parseFloat(guardarian.marketInfo.data.min)) return `Minimum amount is ${guardarian.marketInfo.data.min} ${guardarian.marketInfo.data.from}` 
            else if (parseFloat(guardarian.amount) > parseFloat(guardarian.marketInfo.data.max)) return `Maximum amount is ${guardarian.marketInfo.data.max} ${guardarian.marketInfo.data.from}`
            else if (guardarian?.from && parseFloat(guardarian.amount) > currToken.balance) return `stop pretending to be rich`
            else return ''
        }
    }

    useEffect(() => {
        if (guardarian?.marketInfo?.data) {
            setValidationMsg(genValidateMessage())
        } else {
            setValidationMsg('')
        }
    }, [guardarian.amount, guardarian.marketInfo])

    const switchMode = () => {
        guardarian.setMode((prevMode) => prevMode === 'buy' ? 'sell' : 'buy')
    }

    function changeFrom(value) {
        guardarian.setFrom(value)
    }

    function changeTo(value) {
        guardarian.setTo(value)
    }

    const onInputAmount = value => {
        guardarian.setAmount(value)
    }

    function sendTxn () {
        setSendTransactionLoading(true)
        fetchGet(guardarian.genTxnUrl())
            .then(({data}) => {
                setSendTransactionLoading(false)
                if (data?.redirect_url) {
                    popupCenter({
                        url: url.format(data?.redirect_url),
                        title: 'Guardarian Deposit',
                        w: 560,
                        h: 710,
                    })
                }
            })
            .catch(e => {
                setSendTransactionLoading(false)
            })
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button 
            disabled={
                validationMsg !== '' 
                || guardarian?.marketInfo?.isLoading 
                || guardarian?.estimateInfo?.isLoading 
                || guardarian?.txn?.isLoading
                || sendTransactionLoading
            } 
            onClick={sendTxn}>{guardarian.mode === 'buy' ? 'Buy' : 'Sell'}</Button>
    </>

    return (
        <Modal id="guardarian-modal" title="Guardarian" buttons={buttons}>
            <div className='buy-sell-btns-wrapper'>
                <div className={guardarian.mode === 'buy' ? 'button active' : 'button'} onClick={switchMode}>Buy</div>
                <div className={guardarian.mode === 'sell' ? 'button active' : 'button'} onClick={switchMode}>Sell</div>    
                
            </div>
            
            <div className='input-currencies-wrapper'>
            <div className='amount'>
                <TextInput
                    value={guardarian.amount}
                    label="You send"
                    placeholder="Input amount"
                    onInput={onInputAmount}
                />
            </div>
            <div className='currency'>
                { (guardarian.mode === 'buy' && !guardarian?.fiatList?.isLoading) || (guardarian?.mode === 'sell' && !guardarian?.cryptoList?.isLoading)
                ? <Select 
                    searchable 
                    defaultValue={guardarian.from} 
                    items={guardarian.mode === 'buy' ? guardarian.fiatList.data : guardarian.cryptoList.data} 
                    onChange={({value}) => changeFrom(value)}/>
                : <div className='loading-wrapper'><Loading /> </div>}
            </div>
        </div>
        { (validationMsg !== '') && (<p style={{ color: 'red' }}>{ validationMsg }</p>) }
        { !guardarian.estimateInfo.isLoading && guardarian?.estimateInfo?.data && validationMsg === ''
            ? (<p>Estimation rate: 1 {guardarian?.estimateInfo?.data?.from_currency} ≈ {guardarian?.estimateInfo?.data?.estimated_exchange_rate} {guardarian?.estimateInfo?.data?.to_currency}</p>)
            : <></>}
        <div className='input-currencies-wrapper'>
            <div className='amount'> 
                { !guardarian.estimateInfo.isLoading
                    ? (<TextInput
                        value= {guardarian?.estimateInfo?.data ? guardarian?.estimateInfo?.data?.value : '-'}
                        disabled
                        label="You get"
                    />) 
                    : (<div className='loading-wrapper'><Loading /> </div>
                )}
            </div>
            <div className='currency'>
            { (guardarian?.mode === 'buy' && !guardarian?.cryptoList?.isLoading) || (guardarian?.mode === 'sell' && !guardarian?.fiatList?.isLoading)
                ? <Select 
                    searchable 
                    defaultValue={guardarian?.to} 
                    items={guardarian?.mode === 'sell' ? guardarian?.fiatList?.data : guardarian?.cryptoList?.data} 
                    onChange={({value}) => changeTo(value)}/> 
                : <div className='loading-wrapper'><Loading /> </div>}
            </div>
        </div>
        </Modal>
    )
}                    

export default GuardarianDepositProviderModal