import { useRef, type CSSProperties, type RefObject } from 'react'
import type { Service } from '../data/content'
import { useFollowPointer } from '../hooks/useFollowPointer'
import { useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import { LiquidGlass } from './LiquidGlass'
import styles from './ServicePreview.module.css'

type Props = {
  items: Service[]
  /** Serviço em foco (linha sob o mouse). */
  active: number
  /** Área que faz a pílula aparecer (a lista). */
  trackRef: RefObject<HTMLElement | null>
}

/** Tamanho da pílula (o LiquidGlass mede o elemento e gera o mapa nesse tamanho). */
const W = 220
const H = 110
/** Largura da faixa da borda que refrata. */
const BEVEL = 20
/**
 * Refração com franja cromática: R, G e B em 35 / 36 / 37.
 * ±1 em volta de 36: com ±2 (34/38) o bisel comprime o texto e a franja vira manchas coloridas.
 */
const SCALE = 36

const isVideo = (src: string) => /\.mp4($|\?)/i.test(src)

/**
 * Pílula flutuante que segue o mouse sobre a lista de serviços, como uma lente
 * de vidro líquido: refrata o que está atrás (Chromium) ou vira vidro fosco (outros).
 * Camadas: glass (backdrop-filter) → mídia → tint → shine → kanji.
 * Só desktop com mouse e sem reduced motion.
 */
export function ServicePreview({ items, active, trackRef }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMediaQuery('(min-width: 861px)')
  const enabled = usePointerEffects() && wide
  useFollowPointer(ref, trackRef, { enabled })

  if (!enabled) return null

  return (
    <LiquidGlass
      ref={ref}
      className={styles.preview}
      style={{ '--w': `${W}px`, '--h': `${H}px` } as CSSProperties}
      bevel={BEVEL}
      scale={SCALE}
      chromatic
      blur={1.5}
      saturate={1.25}
      brightness={1.03}
      fallbackBlur={14}
      fallbackSaturate={1.8}
      aria-hidden="true"
      underlay={
        <div className={styles.media}>
          {items.map((item, i) => {
            const src = item.preview?.src
            if (!src) return null
            return (
              <div key={i} className={styles.slide} data-active={i === active || undefined}>
                {isVideo(src) ? (
                  <video src={src} muted autoPlay loop playsInline />
                ) : (
                  <img src={src} alt="" decoding="async" />
                )}
              </div>
            )
          })}
        </div>
      }
    >
      <div className={styles.content}>
        {items.map((item, i) =>
          item.preview?.src ? null : (
            <span key={i} className={styles.kanji} data-active={i === active || undefined}>
              {item.kanji}
            </span>
          ),
        )}
      </div>
    </LiquidGlass>
  )
}
