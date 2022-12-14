import styles from './MultiplerBadges.module.scss'
import { useMemo } from "react"
import { multiplierBadges } from 'ambire-common/src/constants/multiplierBadges'
import { ToolTip } from "components/common"
import cn from 'classnames'

const MultiplierBadges = ({ rewards, apys }) => {
  // Multiplier badges
  const badges = useMemo(() => multiplierBadges.map(badge => {

    let isUnlocked = rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(badge.id)

    if (apys[badge.id]) {
      badge.apy = apys[badge.id].apy
      isUnlocked = apys[badge.id].unlocked
    }

    return {
      ...badge,
      active: isUnlocked
    }
  }), [rewards, apys])

  return (
    <div className={styles.wrapper}>
      {
        badges.map(({ id, name, icon_svg, multiplier, link, active, apy }) => (
          <a href={link} target="_blank" rel="noreferrer" key={id}>
            <ToolTip label={multiplier !== 0 ? (`You ${active ? 'are receiving' : 'do not have'} the ${name} x${multiplier} multiplier`) : (active ? 'This bonus is enabled' : 'You do not have this bonus enabled')}>
              <div className={cn(styles.badge, { [styles.badgeActive]: active })}>
                <div className={cn(styles.iconSvg, styles[id])}></div>
              </div>
            </ToolTip>
          </a>
        ))
      }
    </div>
  )
}

export default MultiplierBadges
