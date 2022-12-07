import styles from './SelectSignerAccount.module.scss'

import { useState } from 'react'
import { Button } from 'components/common'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import cn from 'classnames'

const SelectSignerAccount = ({
    signersToChoose,
    onSignerAddressClicked,
    selectedNetwork = { explorerUrl: 'https://etherscan.io' },
    description = '',
    showTitle
}) => {
    const [currentPage, setCurrentPage] = useState(0)

    const paginate = (arr, size) => {
        return arr.reduce((acc, val, i) => {
            let idx = Math.floor(i / size)
            let page = acc[idx] || (acc[idx] = [])
            page.push(val)

            return acc
        }, [])
    }

    let pages = []
    const pageSize = 5

    pages = paginate(signersToChoose, pageSize)

    const nextPage = () => {
        if (currentPage === pages.length - 1) return
        setCurrentPage(prevState => prevState + 1)
    }

    const prevPage = () => {
        if (currentPage === 0) return
        setCurrentPage(prevState => prevState - 1)
    }

    const formatAddress = addr => {
        return addr.slice(0, 5) + '...' + addr.slice(addr.length - 4, addr.length)
    }

    const prevBtnDisabled = currentPage === 0
    const nextBtnDisabled = currentPage === pages.length - 1

    const onAddressClicked = (addr, index) => {
        onSignerAddressClicked({
            address: addr,
            index: index,
        })
    }

    return (
        <div className={styles.wrapper}>
            {showTitle && <div className={styles.title}>Select a signer account</div>}
            <div className={styles.intro}>{description}</div>
            <div className={styles.signers}>
                <ul>
                    {signersToChoose
                        ? pages[currentPage].map((addr, index) => (
                            <li
                                key={addr}
                                className={cn({
                                    [styles.oddRow]: !(index % 2)}
                                )}
                                onClick={() =>
                                    onAddressClicked(addr, currentPage * pageSize + index)
                                }
                            >
                              <span className={styles.indexRow}>
                                {currentPage * pageSize + index + 1}
                              </span>
                                <span>
                                    {formatAddress(addr)}
                                </span>
                                <a
                                    href={selectedNetwork.explorerUrl + '/address/' + addr}
                                    target='_blank'
                                    rel='noreferrer'
                                    onClick={e => e.stopPropagation()}
                                >
                                    <HiOutlineExternalLink size={25} />
                                </a>
                            </li>
                        ))
                        : null}
                </ul>
                { pages.length > 1 && <>
                    <div className={styles.pages}>
                        {currentPage + 1}/{pages.length}
                    </div>
                    <div className={cn(styles.buttons, 'buttons')}>
                        <Button disabled={prevBtnDisabled} icon={<MdKeyboardArrowLeft/>} small clear type="button" onClick={prevPage}>
                            Previous page
                        </Button>
                        <Button disabled={nextBtnDisabled} iconAfter={<MdKeyboardArrowRight/>} small clear type="button" onClick={nextPage}>
                            Next page
                        </Button>
                    </div>
                </>}
            </div>
        </div>
    )
}

export default SelectSignerAccount
