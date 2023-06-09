import cn from 'classnames'

import { ToolTip } from 'components/common'

import DAPPS_ICON from 'resources/dapps.svg'
import { ReactComponent as InfoIcon } from 'resources/icons/information.svg'
import { ReactComponent as BurgerIcon } from 'resources/icons/burger-menu.svg'
import { ReactComponent as ExitIcon } from 'resources/icons/log-out.svg'

import styles from './DAppMenu.module.scss'

const DAppMenu = ({ toggleSideBarOpen, currentDappData, loadCurrentDappData }) => (
  <div className={styles.wrapper}>
    <ToolTip label="Open Ambire Wallet menu">
      <BurgerIcon onClick={toggleSideBarOpen} className={cn(styles.icon, styles.menuIcon)} />
    </ToolTip>
    <div className={styles.dappData}>
      <ToolTip
        label={`Connected with ${currentDappData?.connectionType} -  see/find out more on our blog`}
      >
        {/* TODO: update the blogpost link */}
        <a
          className="info-btn"
          href="https://blog.ambire.com/connect-to-any-dapp-with-ambire-wallet-and-walletconnect/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <InfoIcon className={styles.infoIcon} />
        </a>
      </ToolTip>
      <ToolTip label={`Connected to ${currentDappData?.name} with Ambire Wallet`}>
        <a
          href={currentDappData?.providedBy?.url || currentDappData?.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <img
            className={styles.dappLogo}
            src={currentDappData?.iconUrl || DAPPS_ICON}
            alt={currentDappData?.name}
          />
        </a>
      </ToolTip>
      <ToolTip label={`Exit from ${currentDappData?.name}`}>
        <ExitIcon
          className={cn(styles.icon, styles.exitIcon)}
          onClick={() => loadCurrentDappData(null)}
        />
      </ToolTip>
    </div>
  </div>
)

export default DAppMenu
