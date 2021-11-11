import "./Transactions.scss";
import { useTransactions } from "../../../hooks";
import Table from "../../common/Table/Table";

const Transactions = (props) => {
  const transactions = useTransactions({
    identity: props.selectedAcc,
    network: props.selectedNetwork,
  });

  //TODO: Remove the mock data
  const theadData = [
    "ID",
    "Hash",
    "Status",
    "Block Number",
    "Timestamp",
    "From",
    "To",
    "Value",
  ];
  const tbodyData = [
    {
      id: "1",
      hash: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef7129",
      status: "1",
      blockNumber: "12345",
      timestamp: "23",
      from: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef1111",
      to: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef2222",
      value: "11.22",
    },
    {
      id: "2",
      hash: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef7124",
      status: "0",
      blockNumber: "21345",
      timestamp: "22",
      from: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef0000",
      to: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef3333",
      value: "10.00",
    },
    {
      id: "3",
      hash: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef7124",
      status: "0",
      blockNumber: "21345",
      timestamp: "22",
      from: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef0000",
      to: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef3333",
      value: "10.00",
    },
    {
      id: "4",
      hash: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef7124",
      status: "0",
      blockNumber: "21345",
      timestamp: "22",
      from: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef0000",
      to: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef3333",
      value: "10.00",
    },
    {
      id: "5",
      hash: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef7124",
      status: "0",
      blockNumber: "21345",
      timestamp: "22",
      from: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef0000",
      to: "0x486e359e90A0BF7E6F917Ff82F57dc96c0ef3333",
      value: "10.00",
    },
  ];

  return (
    <section id="transactions">
      <div className="panel">
        <div className="title">Transactions</div>
        <div className="content">
          <Table theadData={theadData} tbodyData={tbodyData} />
        </div>
      </div>
    </section>
  );
};

export default Transactions;
