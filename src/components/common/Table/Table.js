import "./Table.scss";

import TableRow from "./TableRow/TableRow";
import TableHeadItem from "./TableHead/TableHead";

const Table = ({ theadData, tbodyData}) => {
  return (
    <table id="txn-table">
      <thead>
        <tr>
          {theadData.map((h) => {
            return <TableHeadItem key={h} item={h} />;
          })}
        </tr>
      </thead>
      <tbody>
        {tbodyData.map((item, index) => {
          return <TableRow key={item.id} item={item} index={index} />;
        })}
      </tbody>
    </table>
  );
};

export default Table;
