import './GuardarianDepositProviderModal.scss'


import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { useRelayerData } from 'hooks'
import { fetchGet } from 'lib/fetch'
import { popupCenter } from 'lib/popupHelper'
import url from 'url'

const netAssets = {
	'ethereum': 'ETH',
	'binance-smart-chain': 'BSC',
	'polygon': 'MATIC',
	'fantom': 'FTM',
	'avalanche': 'AVAX'
}

const geFiatLogo = ticker => `https://changenow.io/images/sprite/currencies/${ticker.toLowerCase()}.svg`

const GuardarianDepositProviderModal = ({ relayerURL, selectedNetwork, account, portfolio }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const { tokens } = portfolio
    const [loading, setLoading] = useState(false)
    const [showError, setShowError] = useState(false)
    const [minMaxRange, setMinMaxRange] = useState(null)
    const [isFiatSelected, setIsFiatSelected] = useState(true)
    const [validationMsg, setValidationMsg] = useState('')
    const [amount, setAmount] = useState('')
    const [estimationResp, setEstimationResp] = useState(null)
    //TODO: All the logic should be extract in a hook
    // TODO: handle errors
    // get Fiat Currencies
    const urlFiatCurrencies = `${relayerURL}/guardarian/currencies/fiat`
    const { data: fiatCurrencies, errMsg: errFiatCurrencies, isLoading: isFiatReqLoading } = useRelayerData(urlFiatCurrencies)
    const fiatCurrenciesLabels = (fiatCurrencies && fiatCurrencies.length) ? fiatCurrencies.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url || geFiatLogo(i.ticker) } }) : []

    // get Crypto Currencies
    const urlCryptoCurrencies = `${relayerURL}/guardarian/currencies/crypto`
    const { data: cryptoCurrencies, errMsg: errCryptoCurrencies, isLoading: isCryptoReqLoading } = useRelayerData(urlCryptoCurrencies)
    const availableTokensPerNet = (cryptoCurrencies && cryptoCurrencies.length) ? cryptoCurrencies.filter(({ networks }) => networks.some(({ network }) => network === netAssets[selectedNetwork])) : []
    const cryptoCurrenciesLabels = (availableTokensPerNet && availableTokensPerNet.length) ? availableTokensPerNet.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    
    const [selectedSendCurrency, setSelectedSendCurrency] = useState((fiatCurrenciesLabels && fiatCurrenciesLabels.length) ? fiatCurrenciesLabels[0] : '')
    const [selectedGetCurrency, setSelectedGetCurrency] = useState((cryptoCurrenciesLabels && cryptoCurrenciesLabels.length) ? cryptoCurrenciesLabels[0] : '')
    
    // estimate
    const estimate = useCallback(async amount => {
        if (validationMsg !== '') return
        if (!amount) return
        setLoading(true)
        const urlEstimate = `${relayerURL}/guardarian/estimate/${selectedSendCurrency}/${selectedNetwork}/${amount}/${selectedGetCurrency}/${isFiatSelected}`
        const res = await fetchGet(urlEstimate)
        setLoading(false)
        return res
    }, [validationMsg, relayerURL, selectedSendCurrency, selectedNetwork, selectedGetCurrency, isFiatSelected])

    // transaction
    const makeTransaction = async () => {
        const urlTransaction = `${relayerURL}/guardarian/transaction/${selectedSendCurrency}/${selectedNetwork}/${amount}/${selectedGetCurrency}/${selectedNetwork}`
        const { success, data: txnData} = await fetchGet(urlTransaction)
        if (success) {
            popupCenter({
                url: url.format(txnData.redirect_url),
                title: 'Guardarian Deposit',
                w: 560,
                h: 710,
            })
        }
    }

    const timer = useRef(null)
    useEffect(() => {
        if (timer.current) {
            clearTimeout(timer.current)
        }
        
        if (minMaxRange && (parseFloat(amount) >= parseFloat(minMaxRange.min)) && 
            (parseFloat(amount) <= parseFloat(minMaxRange.max))) {
            const getEstimate = async amount => {
                const estimationRes = await estimate(amount)
                if (estimationRes && estimationRes.success) setEstimationResp(estimationRes)
                else setEstimationResp(null)

                timer.current = null
            }

            timer.current = setTimeout(async () => {
                return getEstimate(amount).catch(console.error)
            }, 300)
        } else setEstimationResp(null)
        
        return () => clearTimeout(timer.current)
    }, [amount, estimate, minMaxRange, relayerURL, selectedGetCurrency, selectedSendCurrency, selectedNetwork])

    // market-info (min-max range)
    const getMarketInfo = useCallback(async fromTo => {
        // TODO: handle errors
        if (!fromTo) return
        const url = `${relayerURL}/guardarian/market-info/${fromTo}`
        const res = await fetchGet(url)
        return res
    }, [relayerURL])

    useEffect(() => {
        let fromTo = null
        const getMarket = async fromTo => {
            const minMaxRangeResp = await getMarketInfo(fromTo)
            if (minMaxRangeResp && minMaxRangeResp.success) setMinMaxRange(minMaxRangeResp.data)
            else setMinMaxRange(null)
        }
        if (selectedSendCurrency && selectedGetCurrency) {
            fromTo = isFiatSelected ?
                `${selectedSendCurrency}_${selectedGetCurrency}-${netAssets[selectedNetwork]}` :
                `${selectedSendCurrency}-${netAssets[selectedNetwork]}_${selectedGetCurrency}`   
        }
        getMarket(fromTo)
    }, [getMarketInfo, selectedGetCurrency, selectedSendCurrency, selectedNetwork, isFiatSelected])
    
    const onInputAmount = value => {
        setAmount(value)
    }

    useEffect(() => {
        if (isFiatSelected) {
            if (minMaxRange && (parseFloat(amount) < parseFloat(minMaxRange.min))) {
                setValidationMsg(`Min amount is ${minMaxRange.min} ${minMaxRange.from}`)
            } else if (minMaxRange && (parseFloat(amount) > parseFloat(minMaxRange.max))) {
                setValidationMsg(`Max amount is ${minMaxRange.max} ${minMaxRange.from}`)
            } else setValidationMsg('')
        } else {
            if (!minMaxRange) return
            if (!tokens) return
            const currentToken = tokens.find(i => i.symbol.toLowerCase() === minMaxRange.from.toLowerCase())
            if (!currentToken) return
            if (parseFloat(amount) > currentToken.balance) {
                setValidationMsg(`Insufficient balance: ${currentToken.balance} ${currentToken.symbol}`)
                return
            }
            if (minMaxRange && (parseFloat(amount) < parseFloat(minMaxRange.min)) ) {
                setValidationMsg(`Min amount is ${minMaxRange.min} ${minMaxRange.from} Current balance is: ${currentToken.balance} ${currentToken.symbol}`)
            } else if (minMaxRange && (parseFloat(amount) > parseFloat(minMaxRange.max))) {
                setValidationMsg(`Max amount is ${minMaxRange.max} ${minMaxRange.from} Current balance: ${currentToken.balance} ${currentToken.symbol}`)
            } else setValidationMsg(``)
        }
    }, [amount, isFiatSelected, minMaxRange, tokens])

    const buyBtnClicked = () => {
        if (!(cryptoCurrenciesLabels && cryptoCurrenciesLabels.length) || !(fiatCurrenciesLabels && fiatCurrenciesLabels.length)) return
    
        setSelectedSendCurrency(fiatCurrenciesLabels[0].value)
        setSelectedGetCurrency(cryptoCurrenciesLabels[0].value)
        setIsFiatSelected(true)
    }

    const sellBtnClicked = () => {
        if (!(cryptoCurrenciesLabels && cryptoCurrenciesLabels.length) || !(fiatCurrenciesLabels && fiatCurrenciesLabels.length)) return
        
        setSelectedSendCurrency(cryptoCurrenciesLabels[0].value)
        setSelectedGetCurrency(fiatCurrenciesLabels[0].value)
        setIsFiatSelected(false)
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button disabled={!estimationResp} onClick={makeTransaction}>Sell</Button>
    </>

    return (
        <Modal id="guardarian-modal" title="Guardarian" buttons={buttons}>
            <div className='buy-sell-btns-wrapper'>
                <div className={isFiatSelected ? 'button active' : 'button'} onClick={buyBtnClicked}>Buy</div>
                <div className={!isFiatSelected ? 'button active' : 'button'} onClick={sellBtnClicked}>Sell</div>    
            </div>
            {/* Add Form here */}
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    <TextInput
                        label="You send"
                        placeholder="Input amount"
                        onInput={onInputAmount}
                    />
                </div>
                <div className='currency'>
                    <Select searchable defaultValue={selectedSendCurrency} items={((!isFiatSelected && tokens) ? cryptoCurrenciesLabels.filter(i => tokens.some(x => i.value.toLowerCase() === x.symbol.toLowerCase())) : fiatCurrenciesLabels).sort((a, b) => a > b ? 1 : -1)} onChange={({value}) => setSelectedSendCurrency(value)}/>
                </div>
            </div>
            { (validationMsg !== '') && (<p style={{ color: 'red' }}>{ validationMsg }</p>)  }
            <p>Estimation rate: { estimationResp && estimationResp.success ? (`1 ${estimationResp.data.from_currency} ≈ ${estimationResp.data.estimated_exchange_rate} ${estimationResp.data.to_currency}`) : ''}</p>
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    { !loading ?
                         (<TextInput
                            value={(estimationResp && estimationResp.success) ? estimationResp.data.value : '-'}
                            disabled
                            label="You get"
                        />) : 
                        (<div className='loading-wrapper'><Loading /> </div>
                    )}
                </div>
                <div className='currency'>
                    <Select searchable defaultValue={selectedGetCurrency} items={ (isFiatSelected ? cryptoCurrenciesLabels : fiatCurrenciesLabels.filter(i => (i.value === 'EUR') || (i.value === 'GBP') || (i.value === 'USD')).sort((a, b) => a > b ? 1 : -1))} onChange={({value}) => setSelectedGetCurrency(value)}/>
                </div>
            </div>
            {/* TODO: added loader */}
        </Modal>
    )
}

export default GuardarianDepositProviderModal