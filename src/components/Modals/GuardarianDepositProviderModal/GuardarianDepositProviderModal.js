import './GuardarianDepositProviderModal.scss'


import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import { useEffect, useState } from 'react'
import { MdVisibilityOff, MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { useRelayerData } from 'hooks'
import { fetchGet } from 'lib/fetch'

const GuardarianDepositProviderModal = ({ relayerURL, selectedNetwork, account, portfolio }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    // const { tokens } = portfolio
    const [loading, setLoading] = useState(false)
    const [showError, setShowError] = useState(false)
    const [disabled, setDisabled] = useState(false)
    
    // get Fiat Currencies
    const urlFiatCurrencies = `${relayerURL}/guardarian/currencies/fiat`
    const { data: fiatCurrencies, errMsg: errFiatCurrencies, isLoading: isFiatReqLoading } = useRelayerData(urlFiatCurrencies)
    console.log('fiatCurrencies', fiatCurrencies)
    const fiatCurrenciesLabels = (fiatCurrencies && fiatCurrencies.length) ? fiatCurrencies.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    const [selectedFiatCurrency, setSelectedFiatCurrency] = useState((fiatCurrenciesLabels && fiatCurrenciesLabels.length) ? fiatCurrenciesLabels[0] : '')

    // get Fiat Currencies
    const urlCryptoCurrencies = `${relayerURL}/guardarian/currencies/crypto`
    const { data: cryptoCurrencies, errMsg: errCryptoCurrencies, isLoading: isCryptoReqLoading } = useRelayerData(urlCryptoCurrencies)
    console.log('cryptoCurrencies', cryptoCurrencies)
    const cryptoCurrenciesLabels = (cryptoCurrencies && cryptoCurrencies.length) ? cryptoCurrencies.map(i => {return { label: i.ticker, value: i.ticker, icon: i.logo_url }}) : []
    const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState((cryptoCurrenciesLabels && cryptoCurrenciesLabels.length) ? cryptoCurrenciesLabels[0] : '')
    
    const onInput = value => {
        if (value > 0) estimate(value)
        
    }

    const estimate = async amount => {
        // add setTimeout here to prevent race conditions
        const url = `${relayerURL}/guardarian/estimate/${selectedFiatCurrency}/${selectedNetwork}/${amount}/${selectedCryptoCurrency}/${selectedNetwork}`
        const { data: estimation, errMsg: errEstimation, isLoading: isEstimationLoading } = await fetchGet(url)
        console.log('estimation', estimation)
    }

    const handleBuySellBtnClicked = () => {

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
                    <TextInput
                        label="Add Amount"
                        placeholder="Input amount"
                        onInput={value => onInput(value)}
                    />
                </div>
                <div className='currency'>
                    <Select searchable defaultValue={selectedFiatCurrency} items={fiatCurrenciesLabels.sort((a, b) => a > b ? 1 : -1)} onChange={({ value }) => setSelectedFiatCurrency(value)}/>
                </div>
            </div>
            <div className='input-currencies-wrapper'>
                <div className='amount'>
                    <TextInput
                        label="Add Amount"
                        placeholder="Input amount"
                        onInput={value => onInput(value)}
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