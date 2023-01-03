import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import cn from 'classnames'
import { networkIconsById } from 'consts/networks'
import { ReactComponent as AlertCircle } from 'resources/icons/alert-circle.svg'

import styles from './Chart.module.scss'
import { useEffect, useMemo, useRef, useState } from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

const colors = [
  "#6000FF",
  "#AE60FF",
  "#38D612",
  "#FD1A64",
  "#ffbc00",
  "#838AFF",
  "#D5FF40",
  "#00B9FF",
  "#ED5911",
  "#08A186",
  "#0D33FF",
  "#EE0DFF",
  "#FFEF0D",
  "#0B62E6",
  "#FF880D",
  "#86B7D9",
  "#E6160B",
  "#00FFF7",
  "#8E49FF",
  "#B68500"
]

const round = num => Math.round((num + Number.EPSILON) * 100) / 100

const Chart = ({ portfolio, hidePrivateValue, selectedNetwork, data, className }) => {
  const networkBalance = hidePrivateValue(portfolio.balance.total.full)
  const [activeItem, setActiveItem] = useState(null)
  const chartRef = useRef()

  const chartData = useMemo(() => ({
    labels: data?.data?.map(i => i.label),
    datasets: [
      {
        data: data?.data?.map(i => i.balanceUSD),
        backgroundColor: portfolio?.balance?.total?.full ? colors : '#1E2033',
        borderColor: '#24263D',
        borderWidth: data?.data?.length > 1 ? 0 : 0, // Change the first zero to 3 to add spacing
        cutout: '85%',
      }
    ]
  }), [data?.data, portfolio?.balance?.total?.full])

  const getItemColor = index => {
    const colorCount = colors.length - 1;
    return index > colorCount ? colors[index - (colors.length * Math.trunc(index / colors.length))] : colors[index];
  }

  const onMouseMove = () => setActiveItem(chartRef?.current?._active[0]?.index)

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  const options = useMemo(() => ({
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (data.empty) {
              return 'No funds on this network'
            }
            return (context.raw.toFixed(2) + '$')
          }
        },
      }
    },
  }), [data.empty])

  const formatDate = (date) => new Date(date).toLocaleTimeString('en-us', { day: 'numeric', year: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.donut}>
        <Doughnut 
          data={chartData}
          options={options}
          ref={chartRef}
        />
        <div className={styles.networkInfo}>
          <img className={styles.networkIcon} src={networkIconsById[selectedNetwork.id]} alt={selectedNetwork.id} />
          <label className={styles.networkAmount}>
            <span className={styles.currency}>$</span>
            {typeof networkBalance === 'number' ? 
              (
                networkBalance >= 10000 ? 
                `${String(round(networkBalance/1000)).split('.').join(',')}K` : 
                (data?.allTokensWithoutPrice ? ' -' : networkBalance.toFixed(2))
              ) :
              (data?.allTokensWithoutPrice ? ' -' : 0 )
            }
          </label>
        </div>
        {portfolio?.resultTime && <div className={styles.lastUpdate}>Last update: {formatDate(portfolio?.resultTime) } </div>}
      </div>
      <div className={styles.legend}>
        <h2 className={styles.legendTitle}>Balance by tokens</h2>
          {!data?.empty ?
            <div className={styles.legendItems}>
              {data?.data?.map((item, i) => (
                <div className={`${styles.item} ${activeItem === i ? styles.active : ''}`} key={`item-${i}`}>{/* hovered logic disabled for now */}
                    <div className={styles.color} style={{backgroundColor: getItemColor(i)}}/>
                    <label>{ item.label }</label>
                    <div className={styles.separator}></div>
                    <div className={styles.percent}>
                      { parseFloat(item.value).toFixed(2) }%
                    </div>
                </div>
              ))} 
            </div> :
            (!data.tokensLength ? (
              <div className={styles.noTokensWrapper}>
              <div className={styles.noTokens}>
                <AlertCircle />
                <label>You don't have any tokens on this network</label>
              </div>
            </div>
            ) : null)
          }
      </div>
  </div>
  )
}

export default Chart