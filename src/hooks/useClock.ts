import { useEffect, useMemo, useState } from 'react'

type Options = {
  /** Mostrar segundos (padrão: true) */
  seconds?: boolean
}

/**
 * Hora atual formatada (HH:MM ou HH:MM:SS, 24h) num fuso específico.
 * Atualiza a cada 1s e limpa o intervalo ao desmontar.
 */
export function useClock(timeZone: string, { seconds = true }: Options = {}) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        ...(seconds ? { second: '2-digit' } : {}),
        hour12: false,
      }),
    [timeZone, seconds],
  )

  const [time, setTime] = useState(() => formatter.format(new Date()))

  useEffect(() => {
    setTime(formatter.format(new Date()))
    const id = window.setInterval(() => setTime(formatter.format(new Date())), 1000)
    return () => window.clearInterval(id)
  }, [formatter])

  return time
}
