import './Select.scss';

import { useEffect, useRef, useState } from "react";
import { BsChevronUp, BsChevronDown } from 'react-icons/bs'
import useOnClickOutside from '../../../helpers/onClickOutside';

const Select = ({ children, native, defaultValue, items, onChange }) => {
    const ref = useRef();
    const [isOpen, setOpen] = useState();
    const [selectedItem, setSelectedItem] = useState({
        label: null,
        value: null,
        icon: null
    });

    const selectItem = item => {
        setSelectedItem(item);
        onChange(item.value);
    };

    useEffect(() => {
        setSelectedItem(items.find(item => item.value === defaultValue));
    }, [defaultValue, items]);

    useOnClickOutside(ref, () => setOpen(false));

    return (
        !native ? 
            <div className="select" onClick={() => setOpen(!isOpen)} ref={ref}>
                <div className="value">
                    {
                        selectedItem.icon ? 
                            <div className="icon">
                                <img src={selectedItem.icon} alt="Icon" />
                            </div>
                            :
                            null
                    }
                    { selectedItem.label || selectedItem.value }
                    <div className="handle">
                        {
                            isOpen ? 
                                <BsChevronUp size={20}></BsChevronUp>
                                :
                                <BsChevronDown size={20}></BsChevronDown>
                        }
                    </div>
                </div>
                {
                    isOpen ? 
                        <div className="list">
                            {
                                items.map(item => (
                                    <div className={`option ${item.value === selectedItem.value ? 'active' : ''}`} key={item.value} onClick={() => selectItem(item)}>
                                        {
                                            item.icon ? 
                                                <div className="icon">
                                                    <img src={item.icon} alt="Icon" />
                                                </div>
                                                :
                                                null
                                        }
                                        { item.label || item.value }
                                    </div>
                                ))
                            }
                        </div>
                        :
                        null
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