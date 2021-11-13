import './Select.scss';

import { useCallback, useEffect, useRef, useState } from "react";
import { BsChevronDown } from 'react-icons/bs'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from '../../../helpers/onClickOutside';

const Select = ({ children, native, monospace, searchable, defaultValue, items, onChange }) => {
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
        setSelectedItem(item);
        onChange(item.value);
    }, [onChange])

    useEffect(() => {
        if (items.length) selectItem(items.find(item => item.value === defaultValue) || items[0])
    }, [defaultValue, items, selectItem]);

    useEffect(() => {
        if (isOpen && searchable) {
            hiddenTextInput.current.focus()
            setSearch('')
        }
    }, [isOpen, searchable])

    useOnClickOutside(ref, () => setOpen(false));

    return (
        !native ? 
            <div className={`select ${monospace ? 'monospace': ''}`} onClick={() => setOpen(!isOpen)} ref={ref}>
                {
                    searchable ? 
                        <input type="text" className="search-input" value={search} ref={hiddenTextInput} onInput={({ target }) => setSearch(target.value)}/>
                        :
                        null
                }
                {
                    selectedItem ? 
                        <div className="value">
                            <div className="icon">
                                {
                                    selectedItem.icon ? 
                                        <img src={selectedItem.icon} alt="Icon" />
                                        :
                                        null
                                }
                            </div>
                            { selectedItem.label || selectedItem.value }
                            <div className="separator"></div>
                            <div className={`handle ${isOpen ? 'open' : ''}`}>
                                <BsChevronDown size={20}></BsChevronDown>
                            </div>
                        </div>
                        :
                        null
                }
                {
                    <CSSTransition unmountOnExit in={isOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                        <div className="list" ref={transitionRef}>
                            {
                                filteredItems.map(item => (
                                    <div className={`option ${item.value === selectedItem.value ? 'active' : ''}`} key={item.value} onClick={() => selectItem(item)}>
                                        <div className="icon">
                                            {
                                                item.icon ? 
                                                    <img src={item.icon} alt="Icon" />
                                                    :
                                                    null
                                            }
                                        </div>
                                        { item.label || item.value }
                                    </div>
                                ))
                            }
                            { children }
                        </div>
                    </CSSTransition>
                }
            </div>
            :
            <select className="select" onChange={ev => onChange(ev.target.value)} defaultValue={defaultValue}>
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