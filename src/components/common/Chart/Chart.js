import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import cn from 'classnames'
import { networkIconsById } from 'consts/networks'
import { ReactComponent as AlertCircle } from 'resources/icons/alert-circle.svg'

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

const round = num => Math.round((num + Number.EPSILON) * 100) / 100

const Chart = ({ portfolio, hidePrivateValue, selectedNetwork, data, className }) => {
  const networkBalance = hidePrivateValue(portfolio.balance.total.full)

  const chartData = {
    labels: data?.data?.map(i => i.label),
    datasets: [
      {
        data: data?.data?.map(i => i.balanceUSD),
        backgroundColor: portfolio?.balance?.total?.full ? colors : '#1E2033',
        borderColor: '#24263D',
        borderWidth: data?.data?.length > 1 ? 0 : 0, // Change the first zero to 3 to add spacing
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
            {typeof networkBalance === 'number' ? 
              (
                networkBalance >= 10000 ? 
                `${round(networkBalance/1000)}K` : 
                networkBalance.toFixed(2)
              ) :
              0
            }
          </label>
        </div>
      </div>
      <div className={styles.legend}>
        <h2 className={styles.legendTitle}>Balance by tokens</h2>
          {!data?.empty ?
            <div className={styles.legendItems}>
              {data?.data?.map((item, i) => (
                <div className={`${styles.item} ${false === item.label ? styles.active : ''}`} key={`item-${i}`}>{/* hovered logic disabled for now */}
                    <div className={styles.color} style={{backgroundColor: getItemColor(i)}}/>
                    <label>{ item.label }</label>
                    <div className={styles.separator}></div>
                    <div className={styles.percent}>
                      { parseFloat(item.value).toFixed(2) }%
                    </div>
                </div>
              ))} 
            </div> :
            <div className={styles.noTokensWrapper}>
              <div className={styles.noTokens}>
                <AlertCircle />
                <label>You don't have any tokens on this network</label>
              </div>
            </div>
          }
      </div>
  </div>
  )
}

export default Chart