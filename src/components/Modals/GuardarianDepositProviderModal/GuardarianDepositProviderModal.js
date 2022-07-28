import './GuardarianDepositProviderModal.scss'


import { Button, Loading, Modal, TextInput, Select, NumberInput } from 'components/common'
import { useEffect, useState, useRef, useCallback } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { useRelayerData } from 'hooks'
import { fetchGet } from 'lib/fetch'

const netAssets = {
	'ethereum': 'ETH',
	'binance-smart-chain': 'BSC',
	'polygon': 'MATIC',
	'fantom': 'FTM',
	'avalanche': 'AVAX'
}

const GuardarianDepositProviderModal = ({ relayerURL, selectedNetwork, account, portfolio }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    // const { tokens } = portfolio
    const [loading, setLoading] = useState(false)
    const [showError, setShowError] = useState(false)
    const [disabled, setDisabled] = useState(false)
    //TODO: All the logic should be extract in a hook
    // get Fiat Currencies
    const urlFiatCurrencies = `${relayerURL}/guardarian/currencies/fiat`
    const { data: fiatCurrencies, errMsg: errFiatCurrencies, isLoading: isFiatReqLoading } = useRelayerData(urlFiatCurrencies)
    const fiatCurrenciesLabels = (fiatCurrencies && fiatCurrencies.length) ? fiatCurrencies.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    const [selectedFiatCurrency, setSelectedFiatCurrency] = useState((fiatCurrenciesLabels && fiatCurrenciesLabels.length) ? fiatCurrenciesLabels[0] : '')

    // get Crypto Currencies
    const urlCryptoCurrencies = `${relayerURL}/guardarian/currencies/crypto`
    const { data: cryptoCurrencies, errMsg: errCryptoCurrencies, isLoading: isCryptoReqLoading } = useRelayerData(urlCryptoCurrencies)
    const availableTokensPerNet = (cryptoCurrencies && cryptoCurrencies.length) ? cryptoCurrencies.filter(({ networks }) => networks.some(({ network }) => network === netAssets[selectedNetwork])) : []
    const cryptoCurrenciesLabels = (availableTokensPerNet && availableTokensPerNet.length) ? availableTokensPerNet.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState((availableTokensPerNet && availableTokensPerNet.length) ? availableTokensPerNet[0] : '')
    
    //estimate
    const estimate = useCallback(async amount => {
        if (!amount) return
        const url = `${relayerURL}/guardarian/estimate/${selectedFiatCurrency}/${selectedNetwork}/${amount}/${selectedCryptoCurrency}/${selectedNetwork}`
        const res = await fetchGet(url)
        console.log('resEST', res)
        return res
    }, [relayerURL, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])

    const [amount, setAmount] = useState(null)
    const [estimationResp, setEstimationResp] = useState(null)

    const timer = useRef(null)
    useEffect(() => {
        if (timer.current) {
            clearTimeout(timer.current)
        }

        const getEstimate = async amount => {
            const estimationRes = await estimate(amount)
            if (estimationRes) setEstimationResp(estimationRes)
            timer.current = null
        }

        timer.current = setTimeout(async () => {
            return getEstimate(amount).catch(console.error)
        }, 300)

        return () => clearTimeout(timer.current)
    }, [amount, estimate, relayerURL, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])

    // market info (min-max range)
    const [minMaxRange, setMinMaxRange] = useState(null)
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
            if (minMaxRangeResp) setMinMaxRange(minMaxRangeResp)
        }
        if (selectedFiatCurrency && selectedCryptoCurrency) fromTo = `${selectedFiatCurrency}_${selectedCryptoCurrency}-${netAssets[selectedNetwork]}` 
        if (fromTo) {
            getMarket(fromTo)
        }
        
    }, [getMarketInfo, selectedCryptoCurrency, selectedFiatCurrency, selectedNetwork])
    
    const handleBuySellBtnClicked = () => {

    }

    const onInputAmount = value => {
        // TODO: Add validation min-max range here
        setAmount(value)
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button  disabled={disabled} onClick={handleBuySellBtnClicked}>Sell</Button>
    </>

    return (
        <Modal id="guardarian-modal" title="Guardarian" buttons={buttons}>
            {/* Add Form here */}
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    <NumberInput
                        label="You send"
                        placeholder="Input amount"
                        onInput={onInputAmount}
                    />
                </div>
                <div className='currency'>
                    <Select searchable defaultValue={selectedFiatCurrency} items={fiatCurrenciesLabels.sort((a, b) => a > b ? 1 : -1)} onChange={({ value }) => setSelectedFiatCurrency(value)}/>
                </div>
            </div>
            <p>Estimation rate: { estimationResp && estimationResp.success ? (`1 ${estimationResp.data.from_currency} ≈ ${estimationResp.data.estimated_exchange_rate} ${estimationResp.data.to_currency}`) : ''}</p>
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    {/* TODO: add loading while estimates */}
                    <TextInput
                        value={(estimationResp && estimationResp.success) ? estimationResp.data.value : '-'}
                        disabled
                        label="You get"
                    />
                </div>
                <div className='currency'>
                    <Select searchable defaultValue={selectedCryptoCurrency} items={cryptoCurrenciesLabels.sort((a, b) => a > b ? 1 : -1)} onChange={({ value }) => setSelectedCryptoCurrency(value)}/>
                </div>
            </div>
            
        </Modal>
    )
}

export default GuardarianDepositProviderModal