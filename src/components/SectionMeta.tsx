import type { ReactNode } from 'react'
import styles from './SectionMeta.module.css'

type Props = {
  /** Posição da seção (do mapa `sections` em content.ts); vira "(01)". */
  index: number
  label: string
  /** Informação à direita (ex.: "和 — 2026", "03 frentes"). */
  aside?: ReactNode
  tone?: 'dark' | 'light'
}

/** Barra de metadados do topo das seções: rótulo numerado à esquerda, info à direita. */
export function SectionMeta({ index, label, aside, tone = 'light' }: Props) {
  return (
    <div className={`${styles.meta} ${styles[tone]}`}>
      <span>
        ({String(index).padStart(2, '0')}) {label}
      </span>
      {aside != null && <span>{aside}</span>}
    </div>
  )
}
