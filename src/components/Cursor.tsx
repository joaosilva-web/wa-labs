import { useRef } from 'react'
import { useLoader } from '../context/LoaderContext'
import { useCursor } from '../hooks/useCursor'
import { usePointerEffects } from '../hooks/useMediaQuery'
import styles from './Cursor.module.css'

/**
 * Bolinha que acompanha o mouse — complemento do cursor nativo, não substituto.
 * Só existe com mouse/trackpad e sem prefers-reduced-motion.
 */
export function Cursor() {
  const { isDone } = useLoader()
  // desligado enquanto o preloader está na tela
  const enabled = usePointerEffects() && isDone
  const ref = useRef<HTMLDivElement>(null)
  useCursor(ref, enabled)

  if (!enabled) return null
  return (
    <div ref={ref} className={styles.cursor} aria-hidden="true">
      <span className={styles.shape} />
    </div>
  )
}
