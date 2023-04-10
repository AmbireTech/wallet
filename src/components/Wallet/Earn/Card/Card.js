import './Card.scss'

import { Select, Segments, NumberInput, Button, Loading } from 'components/common'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { BsArrowDownSquare, BsArrowUpSquare } from 'react-icons/bs'
import { utils } from 'ethers'
import { useModals } from 'hooks'
import { MdOutlineInfo } from 'react-icons/md'

const segments = [{ value: 'Deposit' }, { value: 'Withdraw' }]

const Card = ({ loading, unavailable, tokensItems, icon, details, customInfo, onTokenSelect, onValidate, moreDetails, isDepositsDisabled = false }) => {
    const [segment, setSegment] = useState(segments[0].value)
    const [tokens, setTokens] = useState([])
    const [token, setToken] = useState()
    const [amount, setAmount] = useState(0)
    const [disabled, setDisabled] = useState(true)
    const { showModal } = useModals()
    
    const currentToken = tokens.find(({ value }) => value === token)
    const isAmountTooBig = parseFloat(amount) > (currentToken && 'balanceRaw' in currentToken ? parseFloat(utils.formatUnits(currentToken.balanceRaw, currentToken.decimals)) : 0)

    const buttonDisabled = disabled || amount === '' || parseFloat(amount) <= 0 || isAmountTooBig || (segment === segments[0].value && isDepositsDisabled) 

    // Sort tokens items by balance
    const getEquToken = useCallback(token => tokensItems.find((({ address, type }) => address === token.address && (token.type === 'deposit' ? type === 'withdraw' : type === 'deposit'))), [tokensItems])
    const sortedTokenItems = useMemo(() => [...tokensItems].sort((a, b) => (b?.balance + getEquToken(b)?.balance) - (a?.balance + getEquToken(a)?.balance)), [tokensItems, getEquToken])

    const getMaxAmount = () => {
        if (!currentToken) return 0;
        const { balanceRaw, decimals } = currentToken
        return utils.formatUnits(balanceRaw, decimals)
    }

    const setMaxAmount = () => setAmount(getMaxAmount(amount))

    const isMaxAmount = () => {
        return amount === getMaxAmount()
    }

    useEffect(() => {
        if (segment === segments[0].value) setTokens(sortedTokenItems.filter(({ type }) => type === 'deposit'))
        if (segment === segments[1].value) setTokens(sortedTokenItems.filter(({ type }) => type === 'withdraw'))
    }, [segment, sortedTokenItems])

    useEffect(() => setAmount(0), [token, segment])

    useEffect(() => {
        onTokenSelect(token)
        setDisabled(!token || !tokens.length)
    }, [token, onTokenSelect, tokens.length])

    const availableAmount = !disabled ? `${getMaxAmount()} ${currentToken?.symbol}` : '0'

    const amountLabel = <div className="amount-label">Available Amount: <span title={availableAmount}>{availableAmount}</span></div>

    const showMoreDetails = () => {
        if (!!moreDetails) showModal(moreDetails)
    }

    return (
        <div className="card">
            <div className="title">
                <img src={icon} alt="Icon" />
            </div>
            {
                loading ?
                    <Loading/>
                    :
                    unavailable ?
                        <div className="unavailable">
                            Unavailable on this Network
                        </div>
                        :
                        <div className="content">
                            <Select
                                searchable
                                disabled={disabled}
                                label="Choose Token"
                                defaultValue={token}
                                items={tokens}
                                onChange={({ value }) => setToken(value)}
                            />
                            {
                                !disabled ?
                                   (details.length > 1) ? 
                                        (<ul className="details">
                                            {
                                                details.map(([type, value]) => (
                                                    <li key={type}><b>{type}</b> {value}</li>
                                                ))
                                            }
                                        </ul>) 
                                        :
                                        <>{details[0]}</>
                                :
                                <div className="details-placeholder">
                                    <div/>
                                    <div/>
                                    <div/>
                                </div>
                            }
                            <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)} />
                            {
                                customInfo ? 
                                    <div className="info">
                                        { customInfo }
                                    </div>
                                    :
                                    <>
                                        <NumberInput
                                            disabled={!currentToken?.balance}
                                            // The component does not take these props
                                            // min="0" 
                                            // max={currentToken?.balance}
                                            value={amount}
                                            label={amountLabel}
                                            onInput={(value) => setAmount(value)}
                                            button="MAX"
                                            onButtonClick={setMaxAmount}
                                        />
                                        <div className="separator"></div>
                                        <Button 
                                            disabled={buttonDisabled}
                                            startIcon={segment === segments[0].value ? <BsArrowDownSquare/> : <BsArrowUpSquare/>}
                                            onClick={() => onValidate(segment, token, amount, isMaxAmount())}
                                        >
                                                { segment }
                                        </Button>
                                    </>
                            }
                            <div className="separator"></div>
                            {!!moreDetails && 
                                <Button 
                                    variant="secondary"
                                    startIcon={ <MdOutlineInfo/> }
                                    onClick={showMoreDetails}
                                >
                                    See more details
                                </Button>
                            }
                        </div>
            }
        </div>
    )
}

export default Card
