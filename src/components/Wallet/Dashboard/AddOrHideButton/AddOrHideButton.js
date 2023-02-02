import cn from 'classnames'

import styles from './AddOrHideButton.module.scss'

const AddOrHideButton = ({ onClick, className, children }) => (
  <button className={cn(styles.wrapper, className)} onClick={onClick}>
    { children }
  </button>
)

export default AddOrHideButton