import { useRef, type RefObject } from 'react'
import type { Service } from '../data/content'
import { useFollowPointer } from '../hooks/useFollowPointer'
import { useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import styles from './ServicePreview.module.css'

type Props = {
  items: Service[]
  /** Serviço em foco (linha sob o mouse). */
  active: number
  /** Área que faz a pílula aparecer (a lista). */
  trackRef: RefObject<HTMLElement | null>
}

const isVideo = (src: string) => /\.mp4($|\?)/i.test(src)

/**
 * Pílula flutuante que segue o mouse sobre a lista de serviços.
 * Troca de conteúdo em corte seco; só desktop com mouse e sem reduced motion.
 */
export function ServicePreview({ items, active, trackRef }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMediaQuery('(min-width: 861px)')
  const enabled = usePointerEffects() && wide
  useFollowPointer(ref, trackRef, { enabled })

  if (!enabled) return null

  return (
    <div ref={ref} className={styles.preview} aria-hidden="true">
      <div className={styles.pill}>
        {items.map((item, i) => {
          const src = item.preview?.src
          return (
            <div key={i} className={styles.slide} data-active={i === active || undefined}>
              {src ? (
                isVideo(src) ? (
                  <video src={src} muted autoPlay loop playsInline />
                ) : (
                  <img src={src} alt="" decoding="async" />
                )
              ) : (
                // placeholder: gradiente da paleta + o kanji do serviço
                <span className={`${styles.placeholder} ${styles[`tone${i % 3}`]}`}>
                  {item.kanji}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
