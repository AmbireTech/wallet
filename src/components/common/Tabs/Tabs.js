import React, { useState } from 'react'
import Panel from 'components/common/Panel/Panel'
import cn from 'classnames'
import styles from './Tabs.module.scss'

const Tabs = ({ firstTabLabel, secondTabLabel, firstTab, secondTab, panelClassName }) => {
  const [currentTab, setCurrentTab] = useState(1)

  const handleOpenFirst = () => setCurrentTab(1)
  const handleOpenSecond = () => setCurrentTab(2)

  return (
    <Panel className={cn(panelClassName)}>
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={handleOpenFirst}
          className={cn(styles.button, { [styles.active]: currentTab === 1 })}
        >
          {firstTabLabel}
        </button>
        <button
          type="button"
          onClick={handleOpenSecond}
          className={cn(styles.button, { [styles.active]: currentTab === 2 })}
        >
          {secondTabLabel}
        </button>
      </div>
      {currentTab === 1 ? firstTab : secondTab}
    </Panel>
  )
}

export default Tabs
