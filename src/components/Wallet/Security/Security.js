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

  console.log("priv", privileges);

  const onSelectPriv = (val) => {
    console.log("Priv value", val);
  };

  return (
    <section id="security">
      <div className="panel">
        <div className="title">Set Privileges</div>
        {isLoading && <Loading />}
        {!isLoading &&
          Object.keys(privileges).map((key) => {
            return (
              <div className="content">
                <div>{key}</div>
                <Select
                  defaultValue={privileges[key]}
                  items={OPTIONS_PRIVILEGES}
                  itemLabel="label"
                  itemKey="value"
                  onChange={(value) => onSelectPriv(value)}
                />
              </div>
            );
          })}
      </div>
    </section>
  );
};

export default Security;
