import { useEffect, useState } from "react";
import { getPrivileges } from "../services/privileges";

export default function usePrivileges({ identity, network, accounts }) {
  const [isLoading, setLoading] = useState(true);
  const [privileges, setPrivileges] = useState({});

  // TODO: Remove mapVal
  const mapVal = val => {
		if (val === '0x0000000000000000000000000000000000000000000000000000000000000000') return false
		if (val === '0x0000000000000000000000000000000000000000000000000000000000000001') return true
		return val
	}

  const updatePrivileges = async (identity, network) => {
    setLoading(true);
    let requestPrivResp = await getPrivileges(identity, network, {});

    if (requestPrivResp.resp.status === 200) {
      const selectedAccount = accounts.find((x) => x.id === identity);
      const signerAddress = selectedAccount.signer.address;
      const filteredPrivBySelectedAccount = Object.keys(requestPrivResp.body.privileges).filter(
        (x) => x === signerAddress
      );
      const filtered = filteredPrivBySelectedAccount.reduce((obj, key) => ({ ...obj, [key]: mapVal(requestPrivResp.body.privileges[key]) }), {});
      
      console.log("tesrt", requestPrivResp.body);
      setPrivileges(filtered)
    } else {
      console.log(requestPrivResp.errMsg);
      // setErr(requestPrivResp.body.message ? `Relayer error: ${requestPrivResp.body.message}` : `Unknown no-message error: ${resp.status}`)
    }
    setLoading(false);
  };

  useEffect(() => {
    updatePrivileges(identity, network);
  }, [identity, network]);

  return {
    privileges,
    isLoading,
  };
}
