import cn from 'classnames'

import { Loading } from 'components/common'

import styles from './FormSection.module.scss'

const LoadingFormElement = ({ isLoading, children, smaller }) =>
  isLoading ? (
    <div className={cn(styles.wrapper, { [styles.smaller]: smaller })}>
      <Loading />
    </div>
  ) : (
    children
  )

export default LoadingFormElement
