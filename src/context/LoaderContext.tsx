import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type LoaderState = {
  /** true depois que o preloader terminou a saída e foi desmontado. */
  isDone: boolean
  finish: () => void
}

// Fora do provider, tudo se comporta como "já carregou"
const LoaderContext = createContext<LoaderState>({ isDone: true, finish: () => {} })

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isDone, setDone] = useState(false)
  const finish = useCallback(() => setDone(true), [])
  const value = useMemo(() => ({ isDone, finish }), [isDone, finish])
  return <LoaderContext.Provider value={value}>{children}</LoaderContext.Provider>
}

export const useLoader = () => useContext(LoaderContext)
