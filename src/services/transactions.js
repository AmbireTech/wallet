import { fetchCaught } from "../lib/fetch";

// @TODO consts/cfg
const relayerURL = "http://localhost:1934";

export const getTransactions = async (identity, network, query) => {
  const resp = await fetchCaught(
    `${relayerURL}/identity/${identity}/${network}/transactions`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return resp
};
