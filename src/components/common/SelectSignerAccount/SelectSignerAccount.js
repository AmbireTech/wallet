import { useState } from 'react'
import { Info } from 'components/common'
import { HiOutlineExternalLink } from 'react-icons/hi'
import PaginationButtons from 'components/common/Pagination/PaginationButtons/PaginationButtons'
import styles from './SelectSignerAccount.module.scss'

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
      const idx = Math.floor(i / size)
      const page = acc[idx] || (acc[idx] = [])
      page.push(val)

      return acc
    }, [])
  }

  let pages = []
  const pageSize = 5

  pages = paginate(signersToChoose, pageSize)

  const nextPage = () => {
    if (currentPage === pages.length - 1) return
    setCurrentPage((prevState) => prevState + 1)
  }

  const prevPage = () => {
    if (currentPage === 0) return
    setCurrentPage((prevState) => prevState - 1)
  }

  const formatAddress = (addr) => {
    return `${addr.slice(0, 15)}...${addr.slice(addr.length - 4, addr.length)}`
  }

  const onAddressClicked = (addr, index) => {
    onSignerAddressClicked({
      address: addr,
      index
    })
  }

  return (
    <div className={styles.wrapper}>
      {showTitle && <div className={styles.title}>Choose Address</div>}
      <div className={styles.signers}>
        {!!signersToChoose &&
          pages[currentPage].map((addr, index) => (
            <div
              key={addr}
              className={styles.signer}
              onClick={() => onAddressClicked(addr, currentPage * pageSize + index)}
            >
              <span>{formatAddress(addr)}</span>
              <a
                href={`${selectedNetwork.explorerUrl}/address/${addr}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={styles.link}
              >
                <HiOutlineExternalLink size={25} />
              </a>
            </div>
          ))}
      </div>

      <Info className={styles.info}>{description}</Info>

      <div className={styles.pagination}>
        <PaginationButtons
          page={currentPage}
          items={signersToChoose}
          itemsPerPage={pageSize}
          onPrev={prevPage}
          onNext={nextPage}
        />
      </div>
    </div>
  )
}

export default SelectSignerAccount
