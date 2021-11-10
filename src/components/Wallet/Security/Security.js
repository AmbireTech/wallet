import "./Security.scss";

import { usePrivileges } from "../../../hooks";
import { Loading } from "../../common";
import { Select } from "../../common";
import { Interface } from "ethers/lib/utils";
import privilegesOptions from "../../../consts/privilegesOptions";

const IDENTITY_INTERFACE = new Interface(
  require("adex-protocol-eth/abi/Identity5.2")
);

const Security = (props) => {
  const { privileges, updatedBlock, isLoading } = usePrivileges({
    identity: props.selectedAcc,
    network: props.selectedNetwork,
    accounts: props.accounts,
  });

  const privList = Object.keys(privileges).map((key) => {
    const onSelectPriv = (val) => {
      if (val === privileges[key]) return
      
      const txn = {
        to: props.selectedAcc,
        data: IDENTITY_INTERFACE.encodeFunctionData("setAddrPrivilege", [
          key,
          val,
        ]),
      };
      console.log('txn', txn)
    };

    return (
      <li key={key}>
        <div>{key}</div>
        <Select
          defaultValue={privileges[key]}
          items={privilegesOptions}
          itemLabel="label"
          itemKey="value"
          onChange={onSelectPriv}
        />
      </li>
    );
  });

  return (
    <section id="security">
      <div className="panel">
        <div className="title">Set Privileges</div>
        {isLoading && <Loading />}
        {/* Set a msg if no privileges */}
        <ul className="content">{!isLoading && privList}</ul>
      </div>
    </section>
  );
};

export default Security;
