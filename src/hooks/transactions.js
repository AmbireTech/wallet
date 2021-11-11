import { useEffect, useState } from "react";
import { getTransactions } from "../services/transactions";

export default function useTransactions({ identity, network }) {
  const [isLoading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState({});

  const updateTransactions = async (identity, network) => {
    setLoading(true);
    let requestTransResp = await getTransactions(identity, network, {});

    if (requestTransResp.resp.status === 200) {
      setTransactions(requestTransResp.resp.body);
    } else {
      console.log(requestTransResp.errMsg);
      // setErr(requestPrivResp.body.message ? `Relayer error: ${requestPrivResp.body.message}` : `Unknown no-message error: ${resp.status}`)
    }
    setLoading(false);
  };

  useEffect(() => {
    updateTransactions(identity, network);
  }, [identity, network]);

  return {
    transactions,
    isLoading,
  };
}
