import cn from 'classnames'

import { Loading } from 'components/common'

import styles from './FormSection.module.scss'

const LoadingFormElement = ({
  label,
  className,
  inputsClassName,
  isLoading,
  isLoadingSmaller,
  children
}) =>
  isLoading ? (
    <div className={cn(styles.loading, { [styles.smaller]: isLoadingSmaller })}>
      <Loading />
    </div>
  ) : (
    <div className={cn(styles.wrapper, className)}>
      <label className={styles.label}>{label}</label>
      <div className={cn(styles.inputs, inputsClassName)}>{children}</div>
    </div>
  )

export default LoadingFormElement
