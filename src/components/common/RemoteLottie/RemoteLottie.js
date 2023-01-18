import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'
import { fetchGet } from 'lib/fetch'
import styles from './RemoteLottie.module.scss'
import { MdImage, MdBrokenImage } from 'react-icons/md'
import cn from 'classnames'

const RemoteLottie = (props) => {

  const [animationData, setAnimationData] = useState(null)
  const [animationError, setAnimationError] = useState(false)

  useEffect(() => {
    fetchGet(props.remoteJson).then((res) => {
      setAnimationData(res)
    }).catch(err => {
      console.error(`RemoteLottie: could not load lottie "${props.remoteJson}" : ` + err.message)
      setAnimationError(true)
    })
  }, [props.remoteJson])

  // hacky...not to trigger React does not recognize the `remoteJson` prop on a DOM element.
  let lottieProps = { ...props }
  delete lottieProps.remoteJson

  if (animationData) {
    return <Lottie {...lottieProps} animationData={animationData}/>
  } else {
    return <div className={cn(styles.remoteLottie, props.className)}>
      {
        animationError
          ? (
            <>
              <MdBrokenImage/>
              <span>Could not load animation</span>
            </>
          )
          : (
            <>
              <MdImage/>
              <span>Loading Animation...</span>
            </>
          )
      }
    </div>
  }

}

export default RemoteLottie
