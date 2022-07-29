import './GuardarianDepositProviderModal.scss'


import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import { useEffect, useState, useRef, useCallback } from 'react'
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
    // const { tokens } = portfolio
    const [loading, setLoading] = useState(false)
    const [showError, setShowError] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const [minMaxRange, setMinMaxRange] = useState(null)
    //TODO: All the logic should be extract in a hook
    // get Fiat Currencies
    const urlFiatCurrencies = `${relayerURL}/guardarian/currencies/fiat`
    const { data: fiatCurrencies, errMsg: errFiatCurrencies, isLoading: isFiatReqLoading } = useRelayerData(urlFiatCurrencies)
    const fiatCurrenciesLabels = (fiatCurrencies && fiatCurrencies.length) ? fiatCurrencies.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url || geFiatLogo(i.ticker) } }) : []
    const [selectedFiatCurrency, setSelectedFiatCurrency] = useState((fiatCurrenciesLabels && fiatCurrenciesLabels.length) ? fiatCurrenciesLabels[0] : '')

    // get Crypto Currencies
    const urlCryptoCurrencies = `${relayerURL}/guardarian/currencies/crypto`
    const { data: cryptoCurrencies, errMsg: errCryptoCurrencies, isLoading: isCryptoReqLoading } = useRelayerData(urlCryptoCurrencies)
    const availableTokensPerNet = (cryptoCurrencies && cryptoCurrencies.length) ? cryptoCurrencies.filter(({ networks }) => networks.some(({ network }) => network === netAssets[selectedNetwork])) : []
    const cryptoCurrenciesLabels = (availableTokensPerNet && availableTokensPerNet.length) ? availableTokensPerNet.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState((availableTokensPerNet && availableTokensPerNet.length) ? availableTokensPerNet[0] : '')
    
    // estimate
    const estimate = useCallback(async amount => {
        if (!amount) return
        setLoading(true)
        const urlEstimate = `${relayerURL}/guardarian/estimate/${selectedFiatCurrency}/${selectedNetwork}/${amount}/${selectedCryptoCurrency}/${selectedNetwork}`
        const res = await fetchGet(urlEstimate)
        setLoading(false)
        return res
    }, [relayerURL, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])

    // transaction
    const makeTransaction = async () => {
        const urlTransaction = `${relayerURL}/guardarian/transaction/${selectedFiatCurrency}/${selectedNetwork}/${amount}/${selectedCryptoCurrency}/${selectedNetwork}`
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

    const [amount, setAmount] = useState(null)
    const [estimationResp, setEstimationResp] = useState(null)

    const timer = useRef(null)
    useEffect(() => {
        if (timer.current) {
            clearTimeout(timer.current)
        }
        
        if (minMaxRange && (parseFloat(amount) >= parseFloat(minMaxRange.min)) && 
            (parseFloat(amount) <= parseFloat(minMaxRange.max))) {
            const getEstimate = async amount => {
                const estimationRes = await estimate(amount)
                if (estimationRes) setEstimationResp(estimationRes)
                timer.current = null
            }

            timer.current = setTimeout(async () => {
                return getEstimate(amount).catch(console.error)
            }, 300)
        } else setEstimationResp(null)
        
        return () => clearTimeout(timer.current)
    }, [amount, estimate, minMaxRange, relayerURL, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])

    // market-info (min-max range)
    const getMarketInfo = useCallback(async fromTo => {
        if (!fromTo) return
        const url = `${relayerURL}/guardarian/market-info/${fromTo}`
        const res = await fetchGet(url)
        console.log('res', res)
        return res
    }, [relayerURL])

    useEffect(() => {
        let fromTo = null
        const getMarket = async fromTo => {
            const minMaxRangeResp = await getMarketInfo(fromTo)
            if (minMaxRangeResp) setMinMaxRange(minMaxRangeResp.data)
        }
        if (selectedFiatCurrency && selectedCryptoCurrency) fromTo = `${selectedFiatCurrency}_${selectedCryptoCurrency}-${netAssets[selectedNetwork]}` 
        if (fromTo) {
            getMarket(fromTo)
        }
        
    }, [getMarketInfo, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])
    

    const [validationMsg, setValidationMsg] = useState('')
    const onInputAmount = value => {
        setAmount(value)
    }

    useEffect(() => {
        if (minMaxRange && (parseFloat(amount) < parseFloat(minMaxRange.min))) {
            setValidationMsg(`Minimum amount is ${minMaxRange.min} ${minMaxRange.from}`)
        } else if (minMaxRange && (parseFloat(amount) > parseFloat(minMaxRange.max))) {
            setValidationMsg(`Maximum amount is ${minMaxRange.max} ${minMaxRange.from}`)
        } else {
            setValidationMsg('')}
    }, [amount, minMaxRange])

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button  disabled={disabled} onClick={makeTransaction}>Sell</Button>
    </>

    return (
        <Modal id="guardarian-modal" title="Guardarian" buttons={buttons}>
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
                    <Select searchable defaultValue={selectedFiatCurrency} items={fiatCurrenciesLabels.sort((a, b) => a > b ? 1 : -1)} onChange={({ value }) => setSelectedFiatCurrency(value)}/>
                </div>
            </div>
            { (validationMsg !== '') && (<p style={{ color: 'red' }}>{ validationMsg }</p>)  }
            <p>Estimation rate: { estimationResp && estimationResp.success ? (`1 ${estimationResp.data.from_currency} ≈ ${estimationResp.data.estimated_exchange_rate} ${estimationResp.data.to_currency}`) : ''}</p>
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    {/* TODO: add loading while estimates */}
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
                    <Select searchable defaultValue={selectedCryptoCurrency} items={cryptoCurrenciesLabels.sort((a, b) => a > b ? 1 : -1)} onChange={({ value }) => setSelectedCryptoCurrency(value)}/>
                </div>
            </div>
        {/* { loading && <Loading />} */}
            
        </Modal>
    )
}

export default GuardarianDepositProviderModal