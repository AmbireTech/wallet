import useConstants from 'ambire-common/src/hooks/useConstants'
import { ErrorScreen, Loading } from 'components/common'
import { fetch } from 'lib/fetch'
import { createContext, useContext, useMemo } from 'react'

const ConstantsContext = createContext({
  constants: null,
  retryFetch: null
})

export default function ConstantsProvider({
  children,
}) {
  const { constants, isLoading, retryFetch, hasError } = useConstants({ fetch, endpoint: process.env.REACT_APP_CONSTANTS_ENDPOINT })

  const ConstantsProviderValue = useMemo(() => ({ constants, retryFetch }), [constants, retryFetch])

  return (
    <ConstantsContext.Provider value={ConstantsProviderValue}>
      {isLoading ? <Loading /> : (!hasError && constants) ? children : <ErrorScreen />}
    </ConstantsContext.Provider>
  )
}

export function useConstantsContext() {
  return useContext(ConstantsContext)
}
