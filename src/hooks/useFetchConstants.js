import { fetchCaught } from 'lib/fetch'
import { useEffect, useState } from 'react'

function useFetchConstants() {
  const [data, setData] = useState({
    tokenList: [],
    humanizerInfo: [],
    WALLETInitialClaimableRewards: [],
    adexToStakingTransfers: []
  })

  useEffect(() => {
    const fetchConstants = async() => {
      const cache = (await fetchCaught('https://jason.ambire.com/cache.json')).body

      if ((cache.lastUpdated > Date.now()) || data.humanizerInfo.length === 0) {
        const result = (await fetchCaught('https://jason.ambire.com/result.json')).body
        const adexToStakingTransfers = (await fetchCaught('https://jason.ambire.com/adexToStakingTransfers.json')).body
      
        setData(result ? 
          {
            tokenList: result.tokenList,
            humanizerInfo: result.humanizerInfo,
            WALLETInitialClaimableRewards: result.WALLETInitialClaimableRewards,
          } : {
            tokenList: [],
            humanizerInfo: [],
            WALLETInitialClaimableRewards: [],
          },
          {
            adexToStakingTransfers: adexToStakingTransfers ? adexToStakingTransfers : []
          }
        )
      }

    } 
    fetchConstants()
  }, [data.humanizerInfo.length])

  return data
}

export default useFetchConstants