import cn from 'classnames'
import { useState } from 'react'
import Panel from 'components/common/Panel/Panel'
import styles from './Tabs.module.scss'

const Tabs = ({
  firstTabLabel,
  secondTabLabel,
  firstTab,
  secondTab,
  className,
  panelClassName,
  buttonClassName,
  shadowClassName,
  footer,
  defaultTab
}) => {
  const [currentTab, setCurrentTab] = useState(defaultTab || 1)

  const handleOpenFirst = () => setCurrentTab(1)
  const handleOpenSecond = () => setCurrentTab(2)

  return (
    <Panel className={cn(styles.panel, panelClassName)}>
      <div className={styles.buttons}>
        <button
          type="button"
          onClick={handleOpenFirst}
          className={cn(styles.button, buttonClassName, { [styles.active]: currentTab === 1 })}
        >
          {firstTabLabel}
        </button>
        <button
          type="button"
          onClick={handleOpenSecond}
          className={cn(styles.button, buttonClassName, { [styles.active]: currentTab === 2 })}
        >
          {secondTabLabel}
        </button>
        <div className={cn(styles.shadow, shadowClassName)} />
      </div>
      <div className={cn(styles.tab, className)}>
        {currentTab === 1 ? firstTab : secondTab}
        {footer}
      </div>
    </Panel>
  )
}

export default Tabs
