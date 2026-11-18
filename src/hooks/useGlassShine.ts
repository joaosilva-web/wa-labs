import { useEffect, type RefObject } from 'react'
import { usePointerEffects } from './useMediaQuery'

/**
 * Escreve `--mx` (0 → 1, posição horizontal do mouse no elemento) sem estado do React.
 * O CSS usa esse valor pra inclinar levemente o reflexo especular (::after do botão).
 * Só ativo com ponteiro fino e sem prefers-reduced-motion.
 */
export function useGlassShine(ref: RefObject<HTMLElement | null>) {
  const enabled = usePointerEffects()

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width).toFixed(3))
    }
    const onLeave = () => el.style.removeProperty('--mx')

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [ref, enabled])
}
