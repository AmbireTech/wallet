import cn from 'classnames'

import FinalCountdown from 'components/common/FinalCountdown/FinalCountdown'

import { ReactComponent as ChevronRightIcon } from 'resources/icons/chevron-right.svg'
import { ReactComponent as BellIcon } from './images/bell.svg'

import styles from './PromoBanner.module.scss'

const pattern = new RegExp(/\${{(\w+)}}/, 'gi')

const PromoBanner = ({ data, togglePromo, minimized } = {}) => {
  const { id, text, title, icon, type, resources, period } = data
  if (!text) return null

  const split = text.split(pattern)
  const { emojies, color, background, ...linksRes } = resources

  const links = Object.entries(linksRes).reduce((anchors, [key, { label, href } = {}]) => {
    const anc = (
      <a key={key} className={styles.link} href={href} target="_blank" rel="noreferrer noopener">
        {label}
      </a>
    )

    anchors[key] = anc
    return anchors
  }, {})

  const elmojies = Object.entries({ ...emojies }).reduce((elmos, [key, { text, size } = {}]) => {
    const elmo = (
      <span key={key} className={styles.emoji} style={{ fontSize: size }}>
        {text}
      </span>
    )

    elmos[key] = elmo
    return elmos
  }, {})

  return (
    <div
      className={cn(styles.wrapper, { [styles.minimized]: minimized })}
      onClick={() => (!!id && minimized ? togglePromo(id) : null)}
    >
      <div className={styles.bannerWrapper}>
        <div className={cn(styles.banner, styles[type || 'info'])}>
          <div className={styles.iconAndBody}>
            <div className={styles.iconWrapper}>{icon}</div>
            <div className={styles.body}>
              <h4 className={styles.title}>{title}</h4>
              {text ? (
                <p className={styles.text}>{split.map((x) => links[x] || elmojies[x] || x)}</p>
              ) : null}
            </div>
          </div>
          {period?.to && period?.timer && <FinalCountdown endDateTime={period.to} />}
          <div className={styles.minimizeIconWrapper} onClick={() => togglePromo(id)}>
            <ChevronRightIcon className={styles.minimizeIcon} />
          </div>
        </div>
      </div>
      {!!id && <BellIcon className={cn(styles.bellIcon, { [styles.visible]: minimized })} />}
    </div>
  )
}

export default PromoBanner
