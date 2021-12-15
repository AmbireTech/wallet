import { useEffect, useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useHistory } from 'react-router'

export const useOneTimeQueryParam = searchParam => {
    const { search } = useLocation()
    const history = useHistory()
    const urlSearchParams = useMemo(() => new URLSearchParams(search), [search])
    const [oneTimeQueryParam, setOneTimeQueryParam] = useState(urlSearchParams.get(searchParam))
    
    const deleteOneTimeQueryParam = useCallback(() => {
        if (urlSearchParams.has(searchParam)) {
            urlSearchParams.delete(searchParam)
            history.replace({
                search: urlSearchParams.toString(),
            })
        }
    }, [history, urlSearchParams, searchParam])

    useEffect(() => {
        if (urlSearchParams && urlSearchParams.get(searchParam)) setOneTimeQueryParam(urlSearchParams.get(searchParam))
        deleteOneTimeQueryParam()
    }, [deleteOneTimeQueryParam, urlSearchParams, searchParam])
    
    return oneTimeQueryParam
}
