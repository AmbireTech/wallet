import './GuardarianDepositProviderModal.scss'

import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import {useState, useMemo, useCallback} from 'react'
import { MdOutlineClose } from 'react-icons/md'
import useGuardarian from './useGuardarian'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { ToolTip } from 'components/common'
import { fetchGet } from 'lib/fetch';
import { popupCenter } from 'lib/popupHelper'
import url from 'url'


const GuardarianDepositProviderModal = ({ relayerURL, walletAddress, selectedNetwork, portfolio }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const guardarian = useGuardarian({relayerURL, selectedNetwork, initMode: 'buy', tokens: portfolio.tokens, walletAddress, addToast })
    const [sendTransactionLoading, setSendTransactionLoading] = useState(false)

    const getCurrentTokenFromBalance = useCallback(() => {
        if (portfolio.tokens && guardarian?.cryptoCurrencies?.data && guardarian.mode === 'sell') {
            const token = guardarian?.cryptoCurrencies?.data?.find(t => t.ticker === guardarian.from)
            return portfolio?.tokens?.find(t => token?.networks?.find(nt => (nt?.token_contract?.toLowerCase() === t?.address?.toLowerCase())
                || (nt?.network === guardarian.NETWORK_MAPPING[guardarian.network] && t?.address.toLowerCase() ===  guardarian.NATIVE_ADDRESS && nt?.token_contract === null)))
        }
        else return {}
    }, [guardarian, portfolio.tokens])

    const validationMsg = useMemo(() => {
        const marketData = guardarian?.marketInfo?.data

        // In case of failed market info or estimate requests
        if (guardarian?.marketInfo?.error || guardarian?.estimateInfo?.error) return 'Sorry! We couldn\'t estimate your order! Please try again later!'

        // If there is no market data fetch yet, we can't validate
        if (!marketData) return ''

        const userAmount = parseFloat(guardarian.amount)
        const marketMin = parseFloat(marketData.min)
        const marketMax = parseFloat(marketData.max)

        if (guardarian.mode === 'buy') {
            if (userAmount < marketMin) return `Minimum amount is ${marketData.min} ${marketData.from}`
            if (userAmount > marketMax) return `Maximum amount is ${marketData.max} ${marketData.from}`
        } else if (guardarian.mode === 'sell') {
            const currToken = getCurrentTokenFromBalance()

            if (userAmount < marketMin) return `Minimum amount is ${marketData.min} ${marketData.from}`
            if (userAmount > marketMax) return `Maximum amount is ${marketData.max} ${marketData.from}`
            if (currToken && guardarian?.from && (userAmount > currToken.balance)) return `You do not have enough funds`
        }

        return ''
    }, [guardarian, getCurrentTokenFromBalance])

    const switchMode = () => {
        // On switching mode, reset from/to, because the next form gets obsolete field values
        // and can result in wrong API calls (fired in `useGuardarian` useEffect)
        guardarian.setMode((prevMode) => prevMode === 'buy' ? 'sell' : 'buy')
        guardarian.setAmount('')
        guardarian.setFrom('')
        guardarian.setTo(guardarian.mode === 'buy' ? guardarian.DEFAULT_CRYPTO[guardarian.NETWORK_MAPPING[guardarian.network]] : '')
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
                addToast('Error while trying to send transaction', { error: true })
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
                || guardarian?.amount === ''
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

            <div className='estimation-info-wrapper'>
                <div className='extra-fees'>
                    <ToolTip label='All the exchange fees are added into the rate. There are no extra costs.'>
                        <p>No extra fees</p>
                    </ToolTip>
                </div>
                <div className='estimation-rate'>
                    <ToolTip label='This is expected rate. Guardarian guarantees to pick up the best possible rate on the moment of the exchange'>
                    <p>
                        Estimation rate: {' '}
                        { !guardarian.estimateInfo.isLoading && guardarian?.estimateInfo?.data && validationMsg === ''
                        ? (<>
                        { 1 + guardarian?.estimateInfo?.data?.from_currency} ≈ {guardarian?.estimateInfo?.data?.estimated_exchange_rate} {guardarian?.estimateInfo?.data?.to_currency}
                    </>)
                    : <></>}
                    </p>
                </ToolTip>
                </div>
            </div> 
        <div className='input-currencies-wrapper'>
            <div className='amount'> 
                { !guardarian.estimateInfo.isLoading
                    ? (<TextInput
                        value= {guardarian?.estimateInfo?.data ? guardarian?.estimateInfo?.data?.value : ''}
                        disabled
                        label="You get"
                    />) 
                    : (
                        <>
                            <label>You get</label>
                            <div className='loading-wrapper'><Loading /> </div>
                        </>
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