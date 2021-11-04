import './Select.scss';

import { useEffect, useRef, useState } from "react";
import { BsChevronUp, BsChevronDown } from 'react-icons/bs'
import useOnClickOutside from '../../../helpers/onClickOutside';

const Select = ({ children, native, defaultValue, items, itemKey, itemLabel, onChange }) => {
    const ref = useRef();
    const [isOpen, setOpen] = useState();
    const [selectedItem, setSelectedItem] = useState();

    const selectItem = item => {
        setSelectedItem(item);
        onChange(item[itemKey]);
    };

    useEffect(() => {
        setSelectedItem(items.find(item => item[itemKey] === defaultValue));
    }, [defaultValue]);

    useOnClickOutside(ref, () => setOpen(false));

    return (
        !native ? 
            <div className="select" onClick={() => setOpen(!isOpen)} ref={ref}>
                <div className="value">
                    { selectedItem ? selectedItem[itemLabel || itemKey] : null }
                    {
                        isOpen ? 
                            <BsChevronUp size={20}></BsChevronUp>
                            :
                            <BsChevronDown size={20}></BsChevronDown>
                    }
                </div>
                {
                    isOpen ? 
                        <div className="list">
                            {
                                items.map(item => (
                                    <div className={`option ${item[itemKey] === selectedItem[itemKey] ? 'active' : ''}`} key={item[itemKey]} onClick={() => selectItem(item)}>
                                        { item[itemLabel || itemKey] }
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
                        <option key={item[itemKey]} value={item[itemKey]}>
                            { item[itemLabel || itemKey] }
                        </option>
                    ))
                }
            </select>
    );
};

export default Select;