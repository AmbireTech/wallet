import useStorage from 'common/src/hooks/useStorage'

export default function useLocalStorage({ key, defaultValue, isStringStorage, setInit }) {
  return useStorage({ storage: localStorage, key, defaultValue, isStringStorage, setInit })
}
