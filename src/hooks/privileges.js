import { useEffect, useState } from "react";
import { getPrivileges } from "../services/privileges";

export default function usePrivileges({ identity, network, accounts }) {
  const [isLoading, setLoading] = useState(true);
  const [privileges, setPrivileges] = useState({});

  const updatePrivileges = async (identity, network) => {
    setLoading(true);
    let requestPrivResp = await getPrivileges(identity, network, {});

    if (requestPrivResp.resp.status === 200) {  
      setPrivileges(requestPrivResp.body.privileges)
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
