import cn from 'classnames'
import { AiOutlineLoading } from 'react-icons/ai'
import styles from './Button.module.scss'

const Button = ({
  variant,
  color,
  size,
  loading,
  startIcon,
  endIcon,
  disabled,
  onClick,
  className,
  children,
  title,
  type,
  form,
}) => {
  return (
    <button
      onClick={(...args) => !disabled && onClick && onClick.apply(this, args)}
      className={cn(styles.wrapper, className, styles[color], styles[variant], styles[size], {
        [styles.disabled]: disabled || loading,
        [styles.loading]: loading,
      })}
      // disabled={disabled} // causing pointer-events to not trigger
      title={title}
      // used with <form>
      type={type}
      form={form}
    >
      {startIcon && startIcon}
      {!loading ? children : <div className={styles.loadingInner}>
        <AiOutlineLoading />
        <p className={styles.loadingText}>Loading...</p>
      </div>}
      {endIcon && endIcon}
    </button>
  )
}

Button.defaultProps = {
  variant: 'outlined',
}

export default Button
