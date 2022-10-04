import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import cn from 'classnames'
import { useState } from 'react'
import { networkIconsById } from 'consts/networks'

import styles from './Chart.module.scss'

ChartJS.register(ArcElement, Tooltip, Legend)

const colors = [
  "#6000FF",
  "#AE60FF",
  "#4DE827",
  "#FD1A64",
  "#FFBC00",
  "#898DCB",
]

const options = {
  plugins: {
    legend: {
      display: false
    }
  }
}

const Chart = ({ portfolio, hidePrivateValue, selectedNetwork,  data, className }) => {
  const networkBalance = hidePrivateValue(portfolio.balance.total.full)
  const [hoveredItem, setHoveredItem] = useState({});

  const sortedData = () => data.sort((a, b) => b.value - a.value)

  const chartData = {
    labels: sortedData().map(i => i.label),
    datasets: [
      {
        data: sortedData().map(i => i.balanceUSD),
        backgroundColor: colors,
        borderColor: '#24263D',
        borderWidth: 3,
        cutout: '80%',
      },
    ],
  }

  const getItemColor = index => {
    const colorCount = colors.length - 1;
    return index > colorCount ? colors[index - (colors.length * Math.trunc(index / colors.length))] : colors[index];
  }

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.donut}>
        <Doughnut 
          data={chartData} 
          options={options}
        />
        <div className={styles.networkInfo}>
          <img className={styles.networkIcon} src={networkIconsById[selectedNetwork.id]} alt={selectedNetwork.id} />
          <label className={styles.networkAmount}>
            <span className={styles.currency}>$</span>
            {networkBalance >= 10000 ? `${(networkBalance/1000).toFixed(1)}K` : networkBalance}
          </label>
        </div>
      </div>
      <div className={styles.legend}>
        <h2 className={styles.legendTitle}>Balance by tokens</h2>
        <div className={styles.legendItems}>
          {
            data.map((item, i) => (
              <div className={`${styles.item} ${hoveredItem === item.label ? styles.active : ''}`} key={`item-${i}`}>
                  <div className={styles.color} style={{backgroundColor: getItemColor(i)}}/>
                  <label>{ item.label }</label>
                  <div className={styles.separator}></div>
                  <div className={styles.percent}>
                    { parseFloat(item.value).toFixed(2) }%
                  </div>
              </div>
            ))
          }
        </div>
      </div>
  </div>
  )
}

export default Chart