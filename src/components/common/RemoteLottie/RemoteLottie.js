import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'
import { fetchGet } from 'lib/fetch'
import { MdImage, MdBrokenImage } from 'react-icons/md'
import cn from 'classnames'
import styles from './RemoteLottie.module.scss'

const RemoteLottie = ({ remoteJson, className, lottieProps }) => {
  const [animationData, setAnimationData] = useState(null)
  const [animationError, setAnimationError] = useState(false)

  useEffect(() => {
    fetchGet(remoteJson)
      .then((res) => {
        setAnimationData(res)
      })
      .catch((err) => {
        console.error(`RemoteLottie: could not load lottie "${remoteJson}" : ${err.message}`)
        setAnimationError(true)
      })
  }, [remoteJson])

  if (animationData) {
    return <Lottie {...lottieProps} className={className} animationData={animationData} />
  }
  return (
    <div className={cn(styles.remoteLottie, className)}>
      {animationError ? (
        <>
          <MdBrokenImage />
          <span>Could not load animation</span>
        </>
      ) : (
        <>
          <MdImage />
          <span>Loading Animation...</span>
        </>
      )}
    </div>
  )
}

export default RemoteLottie
