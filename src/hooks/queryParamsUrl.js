import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useHistory } from 'react-router'

const QUERY_PARAMS_URI = 'uri'

export const useQueryParamsUrl = () => {
    const { search } = useLocation()
    const history = useHistory()

    const queryParamsUrl = useMemo(() => new URLSearchParams(search.split('?').slice(1).join('?').split('#')[0]), [search])

    const deleteUriQueryParams = useCallback(() => {
        if (queryParamsUrl.has(QUERY_PARAMS_URI)) {
            queryParamsUrl.delete(QUERY_PARAMS_URI)
            history.replace({
                search: queryParamsUrl.toString(),
            })
        }
    }, [history, queryParamsUrl])

    return {
        queryParamsUrl,
        deleteUriQueryParams,
    }
}
