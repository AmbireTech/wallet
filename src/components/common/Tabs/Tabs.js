import cn from 'classnames'
import { useState } from 'react'
import Panel from 'components/common/Panel/Panel'
import styles from './Tabs.module.scss'

const Tabs = ({ 
  firstTabLabel, 
  secondTabLabel,
  firstTab,
  secondTab,
  panelClassName,
}) => {
  const [currentTab, setCurrentTab] = useState(1)

  const handleOpenFirst = () => setCurrentTab(1)
  const handleOpenSecond = () => setCurrentTab(2)

  return (
    <Panel className={panelClassName || ''}>
      <div className={styles.tabs}>
        <button 
          onClick={handleOpenFirst}
          className={cn(styles.tabsButton, {[styles.active]: currentTab === 1})}
        >
          {firstTabLabel}
        </button>
        <button 
          onClick={handleOpenSecond}
          className={cn(styles.tabsButton, {[styles.active]: currentTab === 2})}
        >
          {secondTabLabel}
        </button>
      </div>
      {currentTab === 1 ? firstTab : secondTab}
    </Panel>
  )
}

export default Tabs