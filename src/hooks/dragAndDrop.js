import { useState, useRef } from 'react'

const useDragAndDrop = (defaultValue, sortingKey, onDropEnd) => {
    const [chosenSort, setChosenSort] = useState(defaultValue)
    
    const dragItem = useRef();
    const dragOverItem = useRef();

    const dragStart = (e, position) => dragItem.current = position;

    const dragEnter = (e, position) => dragOverItem.current = position;

    const drop = (sortedList) => {
        const copyListItems = [...sortedList];
        const dragItemContent = copyListItems[dragItem.current];

        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        const list = copyListItems.map(item => item[sortingKey])

        onDropEnd(list)
    };

    return {
        chosenSort,
        setChosenSort,
        dragStart,
        dragEnter,
        drop
    }
}

export default useDragAndDrop;