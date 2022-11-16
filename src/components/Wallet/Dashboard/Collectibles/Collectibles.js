import styles from './Collectibles.module.scss'

import { MdVisibilityOff } from 'react-icons/md'
import { NavLink } from 'react-router-dom'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import { Loading } from 'components/common'
import HideCollectibleModal from 'components/Modals/HideCollectibleModal/HideCollectibleModal'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min'
import { Button } from 'components/common'
import { useModals } from 'hooks'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'

const Collectibles = ({ selectedNetwork, portfolio, isPrivateMode }) => {
    const params = useParams()
    const history = useHistory()
    const { showModal } = useModals()
    const [isHideTokenModalOpen, setIsHideTokenModalOpen] = useState(false)
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

        if (uri.split('/').length === 1) return 'https://ipfs.io/ipfs/' + uri
        if (uri.split('/')[0] === 'data:image') return uri
        if (uri.startsWith('ipfs://')) return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
        if (uri.split('/')[2].endsWith('mypinata.cloud')) return 'https://ipfs.io/ipfs/' + uri.split('/').slice(4).join('/')
        
        return uri
    }

    const openHideTokenModal = useCallback(() => setIsHideTokenModalOpen(true), [])

    useEffect(() => {
        if(isHideTokenModalOpen) {
            showModal(
                <HideCollectibleModal 
                    portfolio={portfolio} 
                    setIsHideTokenModalOpen={setIsHideTokenModalOpen} 
                    handleUri={handleUri}
                />
            )
        }
    }, [portfolio, isHideTokenModalOpen, showModal])

    if (portfolio.loading) return <Loading />;

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
            <div className={styles.wrapperBtns}>
                <Button mini clear icon={<MdVisibilityOff/>} onClick={() => openHideTokenModal()}>Hide Collectible</Button>
            </div>
            <div className={styles.collectiblesWrapper}>
                {
                    collectiblesList.map(({ network, address, collectionName, assets, balanceUSD }) => (assets || []).map(({ tokenId, data }) => (
                        <div className={styles.collectible} key={tokenId}>
                            <NavLink to={`/wallet/nft/${selectedNetwork.id}/${address}/${tokenId}`}>
                                <div className={styles.artwork} style={{backgroundImage: `url(${handleUri(data.image)})`}}/>
                                <div className={styles.info}>
                                    <div className={styles.collection}>
                                        <div className={styles.collectionIcon} style={{backgroundImage: `url(${handleUri(data.image)})`}}></div>
                                        <span className={styles.collectionName}>{ collectionName }</span>
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.name}>{ data.name }</div>
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