import { fetchCaught } from 'lib/fetch'
import { useEffect, useState } from 'react'

function useFetchConstants() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConstants = async() => {
      const cache = (await fetchCaught('https://jason.ambire.com/cache.json')).body

      if ((cache.lastUpdated > Date.now()) || !data) {
        const result = (await fetchCaught('https://jason.ambire.com/result.json')).body
        const adexToStakingTransfersLogs = (await fetchCaught('https://jason.ambire.com/adexToStakingTransfers.json')).body
      
        setIsLoading(() => {
          setData(result && adexToStakingTransfersLogs ? 
            {
              tokenList: result.tokenList,
              humanizerInfo: result.humanizerInfo,
              WALLETInitialClaimableRewards: result.WALLETInitialClaimableRewards,
              adexToStakingTransfersLogs: adexToStakingTransfersLogs
            } :
            null
          )
          return false
        })
      } else {
        setIsLoading(false)
      }
    } 
    fetchConstants()
  }, [data])

  return {
    constants: data, 
    isLoading
  }
}

export default useFetchConstants