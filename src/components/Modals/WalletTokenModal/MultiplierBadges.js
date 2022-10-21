import { useMemo } from "react"
import { multiplierBadges } from 'ambire-common/src/constants/multiplierBadges'
import { ToolTip } from "components/common"

const MultiplierBadges = ({ rewards }) => {
  // Multiplier badges
  const badges = useMemo(() => multiplierBadges.map(badge => {
    const isUnlocked = rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(badge.id)
    return {
      ...badge,
      active: isUnlocked
    }
  }), [rewards])

  return (
    <div className="badges">
      {
        badges.map(({ id, name, icon, color, multiplier, link, active }) => (
          <a href={link} target="_blank" rel="noreferrer" key={id}>
              <ToolTip label={`You ${active ? 'are receiving' : 'do not have'} the ${name} x${multiplier} multiplier`}>
                  <div className={`badge ${active ? 'active' : ''}`} style={{ backgroundColor: color, borderColor: color }}>
                      <div className="icon">{ icon }</div>
                      <div className="multiplier">x { multiplier }</div>
                  </div>
              </ToolTip>
          </a>
        ))
      }
    </div>
  )
}

export default MultiplierBadges