/* eslint-disable import/no-cycle */
import cn from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { Borders as LoadingBorders, Icon } from 'components/common'
import { CSSTransition } from 'react-transition-group'
import useOnClickOutside from 'hooks/onClickOutside'
import { ReactComponent as ChevronDownIcon } from 'resources/icons/chevron-down.svg'
import styles from './DropDown.module.scss'

export default function DropDown({
  children,
  id,
  icon,
  className,
  menuClassName,
  handleClassName,
  titleClassName,
  title,
  badge,
  open,
  closeOnClick,
  onChange,
  onOpen,
  onClose,
  style,
  isLoading,
  testId
}) {
  const ref = useRef()
  const transitionRef = useRef()
  const [isMenuOpen, setMenuOpen] = useState(false)

    useEffect(() => setMenuOpen(open), [open]);
    useEffect(() => onChange && onChange(isMenuOpen), [onChange, isMenuOpen]);
    useEffect(() => !isMenuOpen && onClose && onClose(), [isMenuOpen, onClose]);
    useEffect(() => {
        if(isMenuOpen) {
            document.dispatchEvent(new CustomEvent("show-overlay", { detail: true}))
            onOpen && onOpen()
        }
    }, [isMenuOpen, onOpen])
    useOnClickOutside(ref, () => setMenuOpen(false));

  return (
    <div
      id={id}
      style={style}
      className={cn(styles.dropdown, className)}
      ref={ref}
      data-testid={testId}
    >
      <div
        role="menuitem"
        tabIndex={0}
        className={styles.content}
        onClick={() => setMenuOpen((prev) => !prev)}
        onKeyDown={() => setMenuOpen((prev) => !prev)}
      >
        {icon ? <div className={styles.icon} style={{ backgroundImage: `url(${icon})` }} /> : null}
        <div className={cn(styles.title, titleClassName)}>{title}</div>
        {badge ? <div className={styles.badge}>{badge > 9 ? '9+' : badge}</div> : null}
        {/* <div className={styles.separator}></div> */}
        <Icon
          size="sm"
          className={cn(styles.handle, handleClassName, { [styles.open]: isMenuOpen })}
        >
          <ChevronDownIcon />
        </Icon>

        {isLoading && <LoadingBorders />}
      </div>
      <CSSTransition
        unmountOnExit
        in={isMenuOpen}
        timeout={200}
        classNames="fade"
        nodeRef={transitionRef}
      >
        <div
          className={cn(styles.menu, menuClassName)}
          ref={transitionRef}
          onClick={closeOnClick ? () => setMenuOpen(false) : null}
          onKeyDown={closeOnClick ? () => setMenuOpen(false) : null}
          role="menuitem"
          tabIndex={0}
        >
          {children}
        </div>
      </CSSTransition>
    </div>
  )
}
