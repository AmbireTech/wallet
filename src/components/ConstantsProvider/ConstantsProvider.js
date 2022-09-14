import useFetchConstants from 'ambire-common/src/hooks/useFetchConstants'
import { fetch } from 'lib/fetch'
import { createContext, useContext, useMemo } from 'react'

const ConstantsContext = createContext({
  constants: null,
  retryFetch: null
})

export default function ConstantsProvider({
  children,
  errorScreen,
  loadingScreen
}) {
  const { constants, isLoading, retryFetch, hasError } = useFetchConstants({ fetch: fetch })

  console.log(constants)

  const ConstantsProviderValue = useMemo(() => ({ constants, retryFetch, useFetchConstants }), [constants, retryFetch])

  return (
    <ConstantsContext.Provider value={ConstantsProviderValue}>
      {isLoading && !constants ? loadingScreen : null}
      {!isLoading && hasError ? errorScreen : null}
      {/* {!hasError && !isLoading && constants ? children : null} */}
    </ConstantsContext.Provider>
  )
}

export function useConstantsContext() {
  return useContext(ConstantsContext)
}
