import "./Security.scss";

import usePrivileges from "../../../hooks/privileges";
import { Loading } from "../../common";

const Security = (props) => {
  const { privileges, updatedBlock, isLoading } = usePrivileges({
    identity: props.selectedAcc,
    network: props.selectedNetwork,
    accounts: props.accounts
  });

  console.log("priv", privileges);

  return (
    <section id="security">
      {isLoading && <Loading />}
      {!isLoading && (
        <div>
          <h1>Security Page</h1>
          {Object.keys(privileges).map(key => {
            return <div>{key} {privileges[key]}</div>
          })}
        </div>
      )}
    </section>
  );
};

export default Security;
