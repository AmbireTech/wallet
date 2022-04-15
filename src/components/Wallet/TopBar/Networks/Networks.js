import { Select } from 'components/common';
import { useLocalStorage, useDragAndDrop } from 'hooks';
import { ToolTip } from 'components/common';
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md';

const Networks = ({
    network,
    setNetwork,
    allNetworks,
  }) => {

    const [userSortedItems, setSortedItems] = useLocalStorage({
        key: 'userSortedItems',
        defaultValue: {}
    })

    const onDropEnd = (list) => {
        if (chosenSort !== 'custom') setChosenSort('custom')
        
        setSortedItems(
            prev => ({
                ...prev,
                networks: list
            })
        )
    }

    const { chosenSort,
        setChosenSort,
        dragStart,
        dragEnter,
        drop
    } = useDragAndDrop(userSortedItems.networks && userSortedItems.networks.length ? 'custom' : 'default', 'value', onDropEnd)

    const sortedNetworks = [...allNetworks].sort((a, b) => {
        if (chosenSort === 'custom' && userSortedItems.networks && userSortedItems.networks.length) {
            const sorted = userSortedItems.networks.indexOf(a.id) - userSortedItems.networks.indexOf(b.id)
            return sorted
        } else {
            const sorted = allNetworks.indexOf(a.id) - allNetworks.indexOf(b.id)
            return sorted
        }
    })

    const networksItems = sortedNetworks.map(({ id, name, icon }) => ({
      label: name,
      value: id,
      icon
    }))
   
    return (
        <Select
            defaultValue={network.id}
            draggable={true}
            dragStart={dragStart}
            dragEnter={dragEnter}
            drop={drop}
            items={networksItems}
            onChange={value => setNetwork(value)}
            draggableHeader={<div className='sort-buttons'>
                <ToolTip label='Sorted networks by drag and drop'>
                    <MdDragIndicator color={chosenSort === "custom" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('custom')} />
                </ToolTip>
                <ToolTip label='Sorted networks by default'>
                    <MdOutlineSort color={chosenSort === "default" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('default')} />
                </ToolTip>
            </div>}
        />
    );
};

export default Networks;  
