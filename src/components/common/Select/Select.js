/* eslint-disable import/no-cycle */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CSSTransition } from 'react-transition-group'
import useOnClickOutside from 'hooks/onClickOutside'
import { Icon, Image, TextInput } from 'components/common'
import { MdOutlineClose, MdDragIndicator } from 'react-icons/md'
import { ReactComponent as ChevronDownIcon } from 'resources/icons/chevron-down.svg'

import cn from 'classnames'
import styles from './Select.module.scss'

const Select = ({
  children,
  native,
  monospace,
  searchable,
  disabled,
  label,
  defaultValue,
  items,
  onChange,
  className,
  iconClassName,
  labelClassName,
  optionClassName,
  selectInputClassName,
  draggable,
  dragStart,
  dragEnter,
  dragTarget,
  drop,
  draggableHeader,
  displayDraggableHeader
}) => {
  const ref = useRef()
  const hiddenTextInput = useRef()
  const transitionRef = useRef()
  const [isOpen, setOpen] = useState()
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState({
    label: null,
    value: null,
    icon: null
  })

  const filteredItems = search.length
    ? items.filter(({ itemLabel }) => itemLabel.toLowerCase().includes(search.toLowerCase()))
    : items

  const selectItem = useCallback(
    (item) => {
      setOpen(false)
      setSearch('')
      setSelectedItem(item)
      onChange(item)
    },
    [onChange]
  )

  useEffect(() => {
    const item = items.find((i) => i.value === defaultValue) || items[0]
    if (item && selectedItem.value !== item.value) selectItem(item)
  }, [items, defaultValue, selectedItem, selectItem])

  useEffect(() => {
    if (!items.length) return setSelectedItem({})
  }, [items])

  useEffect(() => {
    if (isOpen && searchable) {
      hiddenTextInput.current.focus()
      setSearch('')
    }
  }, [isOpen, searchable])

  useOnClickOutside(ref, () => setOpen(false))

  return !native ? (
    <div
      className={`${styles.select} ${monospace ? styles.monospace : ''} ${
        disabled ? styles.disabled : ''
      } ${searchable ? styles.searchable : ''} ${className || ''}`}
      ref={ref}
    >
      {label ? <p className={styles.label}>{label}</p> : null}
      {selectedItem ? (
        <div className={styles.selectContainer}>
          <button
            type="button"
            className={`${styles.selectInput} ${selectInputClassName}`}
            onClick={() => setOpen(!isOpen)}
          >
            <Image src={selectedItem.icon} alt="" className={cn(styles.icon, iconClassName)} />
            <div className={`${styles.label} ${labelClassName}`}>
              {selectedItem.label || selectedItem.value}
            </div>
            {selectedItem.extra && <div className={styles.extra}>{selectedItem.extra}</div>}
            {/* <div className="separator"></div> */}
            <Icon size="sm" className={cn(styles.handle, { [styles.open]: isOpen })}>
              <ChevronDownIcon />
            </Icon>
          </button>
          <CSSTransition
            unmountOnExit
            in={isOpen}
            timeout={200}
            classNames="fade"
            nodeRef={transitionRef}
          >
            <div className={styles.selectMenu} ref={transitionRef}>
              {displayDraggableHeader && draggableHeader}
              {searchable ? (
                <TextInput
                  className={styles.selectSearchInput}
                  disabled={disabled}
                  inputContainerClass={styles.selectInputContainer}
                  placeholder="Search"
                  value={search}
                  ref={hiddenTextInput}
                  buttonLabel={search.length ? <MdOutlineClose /> : null}
                  onInput={(value) => setSearch(value)}
                  onButtonClick={() => setSearch('')}
                />
              ) : null}
              {filteredItems.map((item, i) => (
                <button
                  type="button"
                  className={`${styles.option} ${
                    item.value === selectedItem.value && item.label === selectedItem.label
                      ? styles.active
                      : ''
                  } ${item.disabled ? styles.disabled : ''} ${
                    displayDraggableHeader ? styles.draggableOption : ''
                  } ${optionClassName || ''}`}
                  key={item.value + item.label}
                  onClick={() => !item.disabled && selectItem(item)}
                  draggable={draggable}
                  onDragStart={(e) => draggable && dragStart(e, i)}
                  onMouseDown={(e) => draggable && dragTarget(e, i)}
                  onDragEnter={(e) => draggable && dragEnter(e, i)}
                  onDragEnd={() => draggable && drop(filteredItems)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {draggable && (
                    <MdDragIndicator className={styles.dragHandle} id={`${i}-handle`} />
                  )}
                  <Image src={item.icon} alt="" className={cn(styles.icon, iconClassName)} />
                  <div className={styles.label}>{item.label || item.value}</div>
                  {item.extra && <div className={styles.extra}>{item.extra}</div>}
                </button>
              ))}
              {children}
            </div>
          </CSSTransition>
        </div>
      ) : null}
    </div>
  ) : (
    <select
      className={styles.select}
      disabled={disabled}
      onChange={(ev) => onChange(ev.target.value)}
      defaultValue={defaultValue}
    >
      {items.map((item) => (
        <option
          key={item.value + item.label}
          value={item.value}
          disabled={item.disabled ? 'disabled' : undefined}
        >
          {item.label || item.value}
        </option>
      ))}
    </select>
  )
}

export default Select
