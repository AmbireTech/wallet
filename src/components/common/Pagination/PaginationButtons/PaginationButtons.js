/* eslint-disable import/no-cycle */
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { Button } from 'components/common'
import styles from './PaginationButtons.module.scss'

const PaginationButtons = ({ page, items, itemsPerPage, onPrev, onNext }) => {
  const maxPage = Math.ceil(items.length / itemsPerPage)

  // Do not show the Pagination buttons in case of no items
  if (!items?.length) return

  return (
    <div className={styles.wrapper}>
      Page
      <Button variant="secondary" size="xsm" disabled={page === 0} onClick={onPrev}>
        <HiOutlineChevronLeft />
      </Button>
      <span>
        {page + 1} / {maxPage}
      </span>
      <Button variant="secondary" size="xsm" disabled={page + 1 === maxPage} onClick={onNext}>
        <HiOutlineChevronRight />
      </Button>
    </div>
  )
}

export default PaginationButtons
