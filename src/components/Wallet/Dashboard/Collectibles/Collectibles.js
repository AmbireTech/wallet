import styles from './Collectibles.module.scss'

import { NavLink } from 'react-router-dom'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import { Loading } from 'components/common'
import { useMemo, useState, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min'
import { Button } from 'components/common'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

const Collectibles = ({ portfolio, isPrivateMode }) => {
    const params = useParams()
    const history = useHistory()
    const maxCollectiblesPerPage = 15
    const maxPages = Math.ceil(portfolio.collectibles.length / maxCollectiblesPerPage)
    const defaultPage = useMemo(() => Math.min(Math.max(Number(params.page), 1), maxPages) || 1, [params.page, maxPages])
    const [page, setPage] = useState(defaultPage)
    const collectiblesList = portfolio.collectibles.slice((page - 1) * maxCollectiblesPerPage, page * maxCollectiblesPerPage)

    const paginationControls = (
        <div className={styles.paginationControls}>
          <div className={styles.paginationTitle}>Page</div>
          <Button clear mini onClick={() => page > 1 && setPage(page => page - 1)}><HiOutlineChevronLeft/></Button>
          <div className={styles.paginationCurrent}>{ page } <span>/ { maxPages }</span></div>
          <Button clear mini onClick={() => page < maxPages && setPage(page => page + 1)}><HiOutlineChevronRight/></Button>
        </div>
    )
    
    useEffect(() => history.replace(`/wallet/dashboard/collectibles/${page}`), [page, history])
    useEffect(() => setPage(defaultPage), [defaultPage])
    
    const handleUri = uri => {
        if (!uri) return ''
        uri = uri.startsWith('data:application/json') ? uri.replace('data:application/json;utf8,', '') : uri

        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    if (portfolio.isCurrNetworkProtocolsLoading) return <Loading />;

    if (!portfolio.collectibles.length || isPrivateMode) {
        return (
            <CollectiblesPlaceholder
                isPrivateMode={isPrivateMode}
                collectiblesLength={portfolio.collectibles.length}
            />
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.collectiblesWrapper}>
                {
                    collectiblesList.map(({ network, address, collectionName, collectionImg, assets }) => (assets || []).map(({ tokenId, assetName, assetImg, balanceUSD }) => (
                        <div className={styles.collectible} key={tokenId}>
                            <NavLink to={`/wallet/nft/${network}/${address}/${tokenId}`}>
                                <div className={styles.artwork} style={{backgroundImage: `url(${handleUri(assetImg)})`}}/>
                                <div className={styles.info}>
                                    <div className={styles.collection}>
                                        <div className={styles.collectionIcon} style={{backgroundImage: `url(${collectionImg})`}}></div>
                                        <span className={styles.collectionName}>{ collectionName }</span>
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.name}>{ assetName }</div>
                                        <div className={styles.value}><span className={styles.purpleHighlight}>$</span> {balanceUSD.toFixed(2) }</div>
                                    </div>
                                </div>
                            </NavLink>
                        </div>
                    )))
                }
            </div>    
            {paginationControls}
        </div>        
    )
}

export default Collectibles