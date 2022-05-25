import './TokensList.scss'
import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import Card from 'components/Wallet/EarnNew/Card/Card'

import { TextInput } from "components/common"
import { BigNumber } from "ethers"
import { formatUnits } from "ethers/lib/utils"
import networks from 'consts/networks'
import { getTokenIcon } from 'lib/icons'
import tokensData from 'components/Wallet/EarnNew/tokens.json'
import { GiToken } from 'react-icons/gi'
import { MdOutlineClose } from 'react-icons/md'

const ADX_TOKEN_ADDRESS = '0xade00c28244d5ce17d72e40330b1c318cd12b7c3'
const ADX_STAKING_TOKEN_ADDRESS = '0xb6456b57f03352be48bf101b46c1752a0813491a'
const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'

const ZERO = BigNumber.from(0)


const TokensList = ({ networkId, accountId, rewardsData, addRequest, header, setSelectedToken, selectedToken }) => {
    const [failedImg, setFailedImg] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [customInfo, setCustomInfo] = useState(null)
    const [tokens, setTokens] = useState(tokensData[networkId])
    const [stakingTokenBalanceRaw, SetStakingTokenBalanceRaw] = useState(null)
    const hiddenTextInput = useRef();

    const unavailable = networkId !== 'ethereum'

    const onTokenSelect = useCallback((tokenAddress, isStaked) => {
        setCustomInfo(null)
        let token = tokens.find(({ address }) => address === tokenAddress)
        token.stakedSelected = isStaked
        handleSearch('')
        setSelectedToken(token)  

    }, [])

    const handleSearch = (v) => {
        const value = v.toUpperCase()

        const tokensFiltered = tokensData[networkId].filter(t => t.symbol.toUpperCase().indexOf(value) !== -1 || t.address.toUpperCase() === value)

        setSearch(v)
        setTokens(tokensFiltered)
    }

    const stakedTokens = tokens.filter(t => t.isStaked === true)

    useEffect(() => setLoading(false), [])

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
            loading={loading || (!stakingTokenBalanceRaw && !unavailable)}
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
                    tokens && tokens.length ? (
                    <>
                        <p className="section-title">Available assets</p>
                        <div className="tokens-list">
                            {tokens.map(t => (
                                <div className={`token-item ${selectedToken?.symbol === t.symbol && !selectedToken?.stakedSelected ? 'active': ''}`} onClick={() => onTokenSelect(t.address, false)}>
                                    <div className="header">
                                        {getIcon(t)}
                                        <p className="symbol">{t.symbol}</p>
                                    </div>
                                    <div>
                                        MAX APY: 2.63
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
