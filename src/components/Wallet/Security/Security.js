import "./Security.scss";

import usePrivileges from "../../../hooks/privileges";
import { Loading } from "../../common";
import { Select } from "../../common";

const OPTIONS_PRIVILEGES = [
  {
    id: "1",
    label: "YES",
    value: true,
  },
  {
    id: "2",
    label: "NO",
    value: false,
  },
];

const Security = (props) => {
  const { privileges, updatedBlock, isLoading } = usePrivileges({
    identity: props.selectedAcc,
    network: props.selectedNetwork,
    accounts: props.accounts,
  });

  const privList = Object.keys(privileges).map((key) => {
    return (
      <li key={key}>
        <div>{key}</div>
        <Select
          defaultValue={privileges[key]}
          items={OPTIONS_PRIVILEGES}
          itemLabel="label"
          itemKey="value"
          onChange={(value) => onSelectPriv(value)}
        />
      </li>
    );
  });

  const onSelectPriv = (val) => {
    console.log("Priv value", val);
  };

  return (
    <section id="security">
      <div className="panel">
        <div className="title">Set Privileges</div>
        {isLoading && <Loading />}
        <ul className="content">{!isLoading && privList}</ul>
      </div>
    </section>
  );
};

export default Security;
