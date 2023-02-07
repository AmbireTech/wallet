import { Select } from 'components/common';
import { useDragAndDrop, useCheckMobileScreen } from 'hooks';
import { ToolTip } from 'components/common';
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md';
import SortButtons from 'components/common/Select/SortButtons/SortButtons';
import styles from './Networks.module.scss'

const Networks = ({
    network,
    setNetwork,
    allNetworks,
    userSorting,
    setUserSorting,
    dappsCatalog,
    dapModeTopBar
  }) => {
    const sortType = userSorting.networks?.sortType || 'default'

    const onDropEnd = (list) => {        
        setUserSorting(
            prev => ({
                ...prev,
                networks: {
                    sortType: 'custom',
                    items: list
                }
            })
        )
    }

    const isMobileScreen = useCheckMobileScreen()
    const {
        dragStart,
        dragEnter,
        dragTarget,
        handle,
        target,
        drop
    } = useDragAndDrop('value', onDropEnd)

    const sortedNetworks = [...allNetworks].sort((a, b) => {
        if (sortType === 'custom' && userSorting?.networks?.items?.length) {
            const sorted = userSorting.networks.items.indexOf(a.id) - userSorting.networks.items.indexOf(b.id)
            return sorted
        } else {
            const sorted = allNetworks.indexOf(a.id) - allNetworks.indexOf(b.id)
            return sorted
        }
    })
    const currHideNet = sortedNetworks.filter(n => network.id === n.id && network.hide)
    const networksItems = sortedNetworks.filter(n => !n.hide).concat(currHideNet).map(({ id, name, icon }) => ({
      label: name,
      value: id,
      icon,
      disabled: dapModeTopBar && !dappsCatalog?.currentDappData?.networks?.includes(id)
    }))
   
    return (
        <Select
            defaultValue={network.id}
            className={styles.select}
            selectInputClassName={styles.selectInput}
            draggable={sortType === 'custom' && !isMobileScreen ? true : false}
            dragEnter={dragEnter}
            drop={drop}
            dragStart={(e, index) => {                
                if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, index)
                else e.preventDefault();
             }}
            dragTarget={dragTarget}
            items={networksItems}
            displayDraggableHeader={!isMobileScreen}
            onChange={({ value }) => setNetwork(value)}
            iconClassName={styles.iconClassName}
            labelClassName={styles.labelClassName}
            draggableHeader={
                <SortButtons>
                    <ToolTip label='Sorted networks by drag and drop'>
                        <MdDragIndicator color={sortType === "custom" ? "#27e8a7" : ""} cursor="pointer" 
                        onClick={() => setUserSorting(prev => ({
                            ...prev,
                            networks: {
                                ...prev.networks,
                                sortType: 'custom'
                            }
                        }))} />
                    </ToolTip>
                    <ToolTip label='Sorted networks by default'>
                        <MdOutlineSort color={sortType === "default" ? "#27e8a7" : ""} cursor="pointer" 
                        onClick={() => setUserSorting(prev => ({
                            ...prev,
                            networks: {
                                ...prev.networks,
                                sortType: 'default'
                            }
                        }))} />
                    </ToolTip>
                </SortButtons>   
            }
        />
    );
};

export default Networks;  
