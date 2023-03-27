import { useHistory, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import styles from './Pagination.module.scss'
import PaginationButtons from './PaginationButtons'

// Pagination component based on url. necessary to be independent and synced
const Pagination = ({ items, setPaginatedItems, itemsPerPage, url, parentPage = null }) => {
  const history = useHistory()
  const localParams = useParams()

  const routerPage = parseInt(parentPage || localParams.page || 0)

  const handlePageChange = (page) => {
    const newUrl = url.replace('{p}', page)
    history.push(newUrl)
  }

  // Dirty hack, to avoid rerendering
  const jsonItems = JSON.stringify(items)

  useEffect(() => {
    const parsedItems = JSON.parse(jsonItems)
    setPaginatedItems(
      parsedItems.slice(routerPage * itemsPerPage, routerPage * itemsPerPage + itemsPerPage)
    )
  }, [jsonItems, routerPage, setPaginatedItems, itemsPerPage])

  return (
    !!items.length && (
      <div className={styles.wrapper}>
        <PaginationButtons
          page={routerPage}
          items={items}
          itemsPerPage={itemsPerPage}
          onPrev={() => handlePageChange(routerPage - 1)}
          onNext={() => handlePageChange(routerPage + 1)}
        />
      </div>
    )
  )
}

export default Pagination
