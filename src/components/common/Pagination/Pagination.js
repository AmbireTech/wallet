import cn from 'classnames'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { Button } from 'components/common'
import { useHistory, useParams } from 'react-router-dom'
import { useEffect } from 'react'

import styles from './Pagination.module.scss'

// Pagination component based on url. necessary to be independent and synced
const Pagination = ({ items, setPaginatedItems, itemsPerPage, url, parentPage = null }) => {

  const history = useHistory()
  const localParams = useParams()

  const maxPage = Math.ceil(items.length / itemsPerPage)

  const routerPage = (parentPage || localParams.page || 1) * 1

  const handlePageChange = (page) => {
    const newUrl = url.replace('{p}', page)
    history.push(newUrl)
  }

  // Dirty hack, to avoid rerendering
  const jsonItems = JSON.stringify(items)

  useEffect(() => {
    const parsedItems = JSON.parse(jsonItems)
    setPaginatedItems(parsedItems.slice((routerPage - 1) * itemsPerPage, (routerPage - 1) * itemsPerPage + itemsPerPage))
  }, [jsonItems, routerPage, setPaginatedItems, itemsPerPage])

  return !!items.length &&
    <div className={cn(styles.paginationControlsHolder)}>
      <div className={cn(styles.paginationControls)}>
        Page
        {
          <Button clear mini disabled={routerPage <= 1}
                  onClick={() => handlePageChange(routerPage - 1)}><HiOutlineChevronLeft/></Button>
        }
        <span>{routerPage} / {maxPage}</span>
        {
          <Button clear mini disabled={routerPage >= maxPage}
                  onClick={() => handlePageChange(routerPage + 1)}><HiOutlineChevronRight/></Button>
        }
      </div>
    </div>
}

export default Pagination
