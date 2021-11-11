import "./TableRow.scss"

import { Tooltip } from "../../../common";

const TableRow = ({ item, index }) => {
  const formatHash = (value) => value.slice(0, 21) + "...";
  
  return (
    <tr key={item.id} className={!(index % 2) ? "row-odd" : ""}>
      <td>{item.id}</td>
      <td>
        <Tooltip content={item.hash}>{formatHash(item.hash)}</Tooltip>
      </td>
      <td>{item.status}</td>
      <td>{item.blockNumber}</td>
      <td>{item.timestamp}</td>
      <td>
        <Tooltip content={item.from}>{formatHash(item.from)}</Tooltip>
      </td>
      <td>
        <Tooltip content={item.to}>{formatHash(item.to)}</Tooltip>
      </td>
      <td>{item.value}</td>
    </tr>
  );
};

export default TableRow;
