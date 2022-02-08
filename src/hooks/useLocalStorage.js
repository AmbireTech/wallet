import useStorage from "./useStorage";

export default function useLocalStorage({ key, defaultValue, isStringStorage, setInit }) {
  return useStorage({ storage: localStorage, key, defaultValue, isStringStorage, setInit })
}
