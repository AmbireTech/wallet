import './TokensList.scss'
import {useState, useCallback, useEffect, useRef, useMemo} from "react"
import Card from 'components/Wallet/EarnNew/Card/Card'

import { TextInput } from "components/common"
import { getTokenIcon } from 'lib/icons'
import { GiToken } from 'react-icons/gi'
import { MdOutlineClose } from 'react-icons/md'



const TokensList = ({ networkId, accountId, rewardsData, addRequest, header, setSelectedToken, selectedToken, relayerURL }) => {
    const [failedImg, setFailedImg] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [customInfo, setCustomInfo] = useState(null)
    const [tokens, setTokens] = useState([])
    const [strategies, setStrategies] = useState(null)
    const hiddenTextInput = useRef();

    const onTokenSelect = useCallback((tokenAddress, isStaked) => {
        setCustomInfo(null)
        let token = tokens.find(({ address }) => address === tokenAddress)
        handleSearch('')
        setSelectedToken(token)  

    }, [tokens])

    const handleSearch = (v) => {
        setSearch(v)
    }

    const availableTokens = useMemo(() => {
        return tokens
            .filter(t => parseFloat(t.apy))
            .filter(t => t.symbol.toLowerCase().indexOf(search.toLowerCase()) !== -1 || t.address.toLowerCase() === search.toLowerCase())
            .sort((a, b) => b.apy - a.apy)
    }, [tokens, search])

    const stakedTokens = tokens.filter(t => t.isStaked === true)

    const extractTokens = strategies => {
        const tokens = []

        Object.keys(strategies).forEach(strategy => {
            strategies[strategy].forEach(token => {
                const extractedToken = tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())
                if (!extractedToken || token.apy > extractedToken.apy) {
                    tokens.push({
                        ...token,
                        icon: getTokenIcon(networkId, token.address)
                    })
                }
            })
        })

        return tokens
    }

    useEffect(() => {
        const fetchStrategies = async () => {
            const { data: strategies } = await (await fetch(`${relayerURL}/earn/strategies/${networkId}`)).json()

            setStrategies(strategies)
            setTokens(extractTokens(strategies))
            setLoading(false)
        }

        fetchStrategies()
    }, [relayerURL, networkId])

    const getIcon = ({ icon, fallbackIcon, label }) => {
        if (!icon) return null
        const url = failedImg.includes(icon) && fallbackIcon ? fallbackIcon : icon
        return (
            failedImg.includes(url)
                ? 
                <div className="icon">
                    <GiToken size={16}/>
                    </div>
                : <img
                    className="icon"
                    src={url}
                    draggable="false"
                    alt={label}
                    onError={() => setFailedImg(failed => [...failed, url])}
                />
        )
    }
    return (
        <Card
            loading={loading}
            header={header}
        >
            <div className="tokens-list-wrapper">
                <TextInput
                    className="select-search-input"
                    placeholder="Search name or paste an address"
                    value={search}
                    ref={hiddenTextInput}
                    buttonLabel={search.length ? <MdOutlineClose /> : null}
                    onInput={value => handleSearch(value)}
                    onButtonClick={() => handleSearch('')}
                />
                {
                    availableTokens.length ? (
                    <>
                        <p className="section-title">Available assets</p>
                        <div className="tokens-list">
                            {availableTokens.map(t => (
                                <div className={`token-item ${selectedToken?.symbol === t.symbol ? 'active': ''}`} onClick={() => onTokenSelect(t.address)}>
                                    <div className="header">
                                        {getIcon(t)}
                                        <p className="symbol">{t.symbol}</p>
                                    </div>
                                    <div>
                                        MAX APY: {t.apy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                    ) : null
                }
                {
                    stakedTokens && stakedTokens.length ? (
                    <>
                        <p className="section-title">Staked tokens</p>
                        <div className="tokens-list">
                            {stakedTokens.map(t => (
                                <div className={`token-item ${selectedToken?.symbol === t.symbol && selectedToken?.stakedSelected ? 'active': ''}`} onClick={() => onTokenSelect(t.address, true)}>
                                    <div className="header">
                                        {getIcon(t)}
                                        <p className="symbol">{t.symbol}</p>
                                    </div>
                                    <div>
                                        2.63
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                    ) : null
                }
            </div>
        </Card>
    )
}

export default TokensList
