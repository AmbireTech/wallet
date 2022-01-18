import './Select.scss';

import { useCallback, useEffect, useRef, useState } from "react";
import { BsChevronDown } from 'react-icons/bs'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/onClickOutside';
import { TextInput } from 'components/common';
import { MdOutlineClose } from 'react-icons/md';

const Select = ({ children, native, monospace, searchable, disabled, label, defaultValue, items, onChange }) => {
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

    return (
        !native ? 
            <div className={`select ${monospace ? 'monospace': ''} ${disabled ? 'disabled' : ''} ${searchable ? 'searchable' : ''}`} ref={ref}>
                {
                    label ? 
                        <label>{ label }</label>
                        :
                        null
                }
                {
                    selectedItem ? 
                        <div className="select-container">
                            <div className="select-input" onClick={() => setOpen(!isOpen)}>
                                { selectedItem.icon ? <div className="icon" style={{backgroundImage: `url(${selectedItem.icon})`}}/> : null }
                                <div className="label">{ selectedItem.label || selectedItem.value }</div>
                                <div className="separator"></div>
                                <div className={`handle ${isOpen ? 'open' : ''}`}>
                                    <BsChevronDown size={20}></BsChevronDown>
                                </div>
                            </div>
                            {
                                <CSSTransition unmountOnExit in={isOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                                    <div className="select-menu" ref={transitionRef}>
                                        {
                                            searchable ? 
                                                <TextInput
                                                    className="select-search-input"
                                                    disabled={disabled}
                                                    placeholder="Search"
                                                    value={search}
                                                    ref={hiddenTextInput}
                                                    buttonLabel={search.length ? <MdOutlineClose/> : null}
                                                    onInput={value => setSearch(value)}
                                                    onButtonClick={() => setSearch('')}
                                                />
                                                :
                                                null
                                        }
                                        {
                                            filteredItems.map(item => (
                                                <div className={`option ${item.value === selectedItem.value ? 'active' : ''}`} key={item.value} onClick={() => selectItem(item)}>
                                                    { item.icon ? <div className="icon" style={{backgroundImage: `url(${item.icon})`}}/> : null }
                                                    <div className="label">{ item.label || item.value }</div>
                                                </div>
                                            ))
                                        }
                                        { children }
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
                        <option key={item.value} value={item.value}>
                            { item.label || item.value }
                        </option>
                    ))
                }
            </select>
    );
};

export default Select;