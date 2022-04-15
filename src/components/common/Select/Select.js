import './Select.scss';

import { useCallback, useEffect, useRef, useState } from "react";
import { BsChevronDown } from 'react-icons/bs'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/onClickOutside';
import { TextInput } from 'components/common';
import { MdOutlineClose, MdDragIndicator } from 'react-icons/md';

const Select = ({ children, native, monospace, searchable, disabled, label, defaultValue, items, onChange, className, draggable, dragStart, dragEnter, drop, draggableHeader }) => {
    const ref = useRef();
    const hiddenTextInput = useRef();
    const transitionRef = useRef();
    const [isOpen, setOpen] = useState();
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState({
        label: null,
        value: null,
        icon: null,
    });
    const [failedImg, setFailedImg] = useState([])

    const filteredItems = search.length ? items.filter(({ label }) => label.toLowerCase().includes(search.toLowerCase())) : items

    const selectItem = useCallback(item => {
        setOpen(false)
        setSearch('')
        setSelectedItem(item);
        onChange(item.value);
    }, [onChange])

    useEffect(() => {
        const item = items.find(item => item.value === defaultValue) || items[0]
        if (item && (selectedItem.value !== item.value)) selectItem(item)
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

    useOnClickOutside(ref, () => setOpen(false));

    const getIcon = ({ icon, fallbackIcon, label }) => {
        if (!icon) return null
        const url = failedImg.includes(icon) && fallbackIcon ? fallbackIcon : icon
        return (
            failedImg.includes(url)
                ? < div className="icon" />
                : <img
                    className="icon"
                    src={url}
                    draggable="false"
                    alt={label}
                    onError={() => setFailedImg(failed => [...failed, url])}
                />
        )
    }

    return (
        !native ?
            <div className={`select ${monospace ? 'monospace' : ''} ${disabled ? 'disabled' : ''} ${searchable ? 'searchable' : ''} ${className || ''}`} ref={ref}>
                {
                    label ?
                        <label>{label}</label>
                        :
                        null
                }
                {
                    selectedItem ?
                        <div className="select-container">
                            <div className="select-input" onClick={() => setOpen(!isOpen)}
                                >
                                {getIcon(selectedItem)}
                                <div className="label">{selectedItem.label || selectedItem.value}</div>
                                {selectedItem.extra && <div className="extra">{selectedItem.extra}</div>}
                                {/* <div className="separator"></div> */}
                                <div className={`handle ${isOpen ? 'open' : ''}`}>
                                    <BsChevronDown size={20}></BsChevronDown>
                                </div>
                            </div>
                            {
                                <CSSTransition unmountOnExit in={isOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                                    <div className="select-menu" ref={transitionRef}>
                                        {draggable && draggableHeader}
                                        {
                                            searchable ?
                                                <TextInput
                                                    className="select-search-input"
                                                    disabled={disabled}
                                                    placeholder="Search"
                                                    value={search}
                                                    ref={hiddenTextInput}
                                                    buttonLabel={search.length ? <MdOutlineClose /> : null}
                                                    onInput={value => setSearch(value)}
                                                    onButtonClick={() => setSearch('')}
                                                />
                                                :
                                                null
                                        }
                                        {
                                            filteredItems.map((item, i) => (
                                                <div
                                                    className={`option ${item.value === selectedItem.value ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                                                    key={item.value}
                                                    onClick={() => !item.disabled && selectItem(item)}
                                                    draggable={draggable}
                                                    onDragStart={(e) => dragStart(e, i)}
                                                    onDragEnter={(e) => dragEnter(e, i)}
                                                    onDragEnd={() => drop(filteredItems)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                >
                                                    {draggable && <MdDragIndicator className="drag-indicator" />}
                                                    {getIcon(item)}
                                                    <div className="label">{item.label || item.value}</div>
                                                    {item.extra && <div className="extra">{item.extra}</div>}
                                                </div>
                                            ))
                                        }
                                        {children}
                                    </div>
                                </CSSTransition>
                            }
                        </div>
                        :
                        null
                }
            </div>
            :
            <select className="select" disabled={disabled} onChange={ev => onChange(ev.target.value)} defaultValue={defaultValue}>
                {
                    items.map(item => (
                        <option key={item.value} value={item.value} disabled={item.disabled ? 'disabled' : undefined}>
                            {item.label || item.value}
                        </option>
                    ))
                }
            </select>
    );
};

export default Select;