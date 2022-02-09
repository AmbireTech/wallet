import './Chart.scss';

import DonutChart from "react-donut-chart";
import { useState } from 'react';

const Chart = ({ data, size }) => {
    const [hoveredItem, setHoveredItem] = useState({});

    const colors = [
        "#AA6AFF",
        "#80FFDB",
        "#8088FF",
        "#E680FF",
        "#A5FF80",
        "#E6FF80",
        "#FFC480",
        "#FF8080",
    ];
    
    const strokeColor = "transparent";
    const innerRadius = 0.5;
    const selectedOffset = 0.05;

    const onMouseEnter = (item) => {
        setHoveredItem(item.label);
    };

    const onClick = (item, toggled) => {
        if (toggled) {
            console.log(item);
        }
    };

    const sortData = data => {
        return data.sort((a, b) => b.value - a.value);
    };

    const getItemColor = index => {
        const colorCount = colors.length - 1;
        return index > colorCount ? colors[index - (colors.length * Math.trunc(index / colors.length))] : colors[index];
    };

    return (
        <div className="chart">
            <DonutChart
                className="donut"
                height={size}
                width={size}
                onMouseEnter={(item) => onMouseEnter(item)}
                data={sortData(data)}
                colors={colors}
                startAngle={-90}
                strokeColor={strokeColor}
                innerRadius={innerRadius}
                selectedOffset={selectedOffset}
                legend={false}
                onClick={(item, toggled) => onClick(item, toggled)}
            />
            <div className="legend" style={{maxHeight: size}}>
                {
                    data.map((item, i) => (
                        <div className={`item ${hoveredItem === item.label ? 'active' : ''}`} key={`item-${i}`}>
                            <div className="color" style={{backgroundColor: getItemColor(i)}}/>
                            <label>{ item.label }</label>
                            <div className="separator"></div>
                            <div className="percent">
                                { parseFloat(item.value).toFixed(2) }%
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default Chart;