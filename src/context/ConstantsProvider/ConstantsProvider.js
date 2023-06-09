import useConstants from 'ambire-common/src/hooks/useConstants'
import { ErrorScreen, Loading } from 'components/common'
import { fetch } from 'lib/fetch'
import { createContext, useMemo } from 'react'

const ConstantsContext = createContext({
  constants: null,
  isLoading: true,
  retryFetch: () => {},
  getAdexToStakingTransfersLogs: () => Promise.resolve(null)
})

export default function ConstantsProvider({ children }) {
  const { constants, getAdexToStakingTransfersLogs, isLoading, retryFetch, hasError } =
    useConstants({ fetch, endpoint: process.env.REACT_APP_CONSTANTS_ENDPOINT })

  const ConstantsProviderValue = useMemo(
    () => ({ constants, getAdexToStakingTransfersLogs, retryFetch, isLoading }),
    [constants, getAdexToStakingTransfersLogs, retryFetch, isLoading]
  )

  return (
    <ConstantsContext.Provider value={ConstantsProviderValue}>
      {isLoading ? <Loading /> : !hasError && constants ? children : <ErrorScreen />}
    </ConstantsContext.Provider>
  )
}

export { ConstantsContext }
