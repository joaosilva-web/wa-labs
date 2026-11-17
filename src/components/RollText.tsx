import type { ReactNode } from 'react'
import styles from './RollText.module.css'

/**
 * Texto que "rola" no hover do link/botão pai: duas cópias empilhadas,
 * a primeira sai por cima e a segunda entra por baixo.
 * Só a primeira é lida por leitores de tela.
 */
export function RollText({ children }: { children: ReactNode }) {
  return (
    <span className={styles.roll}>
      <span className={styles.item}>{children}</span>
      <span className={styles.item} aria-hidden="true">
        {children}
      </span>
    </span>
  )
}
