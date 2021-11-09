import { useEffect, useState } from "react";
import { getPrivileges } from "../services/privileges";

export default function usePrivileges({ identity, network, accounts }) {
  const [isLoading, setLoading] = useState(true);
  const [privileges, setPrivileges] = useState({});

  const updatePrivileges = async (identity, network) => {
    setLoading(true);
    let requestPrivResp = await getPrivileges(identity, network, {});

    if (requestPrivResp.resp.status === 200) {
      const selectedAccount = accounts.find((x) => x.id === identity);
      const signerAddress = selectedAccount.signer.address;
      const filteredPrivBySelectedAccount = Object.keys(requestPrivResp.body.privileges).filter(
        (x) => x === signerAddress
      );
      const filtered = filteredPrivBySelectedAccount.reduce((obj, key) => ({ ...obj, [key]: requestPrivResp.body.privileges[key] }), {});
      
      setPrivileges(filtered)
    } else {
      console.log(requestPrivResp.errMsg);
      // setErr(requestPrivResp.body.message ? `Relayer error: ${requestPrivResp.body.message}` : `Unknown no-message error: ${resp.status}`)
    }
    setLoading(false);
  };

  useEffect(() => {
    updatePrivileges(identity, network);
  }, [identity, network, accounts]);

  return {
    privileges,
    isLoading,
  };
}
