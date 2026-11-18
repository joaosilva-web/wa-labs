import { Fragment, useMemo, useRef, type CSSProperties, type RefObject } from 'react'
import type { Service } from '../data/content'
import { useFollowPointer } from '../hooks/useFollowPointer'
import { useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import { buildGlassMap, supportsRefraction } from '../utils/liquidGlass'
import styles from './ServicePreview.module.css'

type Props = {
  items: Service[]
  /** Serviço em foco (linha sob o mouse). */
  active: number
  /** Área que faz a pílula aparecer (a lista). */
  trackRef: RefObject<HTMLElement | null>
}

/** Tamanho da pílula (o mapa de deslocamento é gerado nesse tamanho exato). */
const W = 220
const H = 110
/** Largura da faixa da borda que refrata. */
const BEVEL = 20
/**
 * Deslocamento por canal: R, G e B levemente diferentes = franja cromática fina na borda.
 * ±1 em volta de 36: com ±2 (34/38) o bisel comprime o texto e a franja vira manchas coloridas.
 */
const SCALES = [35, 36, 37] as const
const CHANNEL = [
  '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
] as const

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

  // detectado uma vez; o mapa sai do canvas uma vez por tamanho
  const refraction = useMemo(() => enabled && supportsRefraction(), [enabled])
  const map = useMemo(() => (refraction ? buildGlassMap(W, H, BEVEL) : ''), [refraction])

  if (!enabled) return null

  return (
    <div
      ref={ref}
      className={styles.preview}
      style={{ '--w': `${W}px`, '--h': `${H}px` } as CSSProperties}
      data-refraction={(refraction && !!map) || undefined}
      aria-hidden="true"
    >
      {refraction && map && (
        <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
          <filter
            id="liquid-glass"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={W}
            height={H}
            // sRGB: senão o 128 do mapa deixa de ser "zero" na conversão pra linearRGB
            colorInterpolationFilters="sRGB"
          >
            <feImage href={map} x="0" y="0" width={W} height={H} preserveAspectRatio="none" result="map" />
            {SCALES.map((scale, i) => (
              <Fragment key={scale}>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={scale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result={`d${i}`}
                />
                <feColorMatrix in={`d${i}`} type="matrix" values={CHANNEL[i]} result={`c${i}`} />
              </Fragment>
            ))}
            <feBlend in="c0" in2="c1" mode="screen" result="rg" />
            <feBlend in="rg" in2="c2" mode="screen" />
          </filter>
        </svg>
      )}

      <div className={styles.glass} />

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

      <div className={styles.tint} />
      <div className={styles.shine} />

      <div className={styles.content}>
        {items.map((item, i) =>
          item.preview?.src ? null : (
            <span key={i} className={styles.kanji} data-active={i === active || undefined}>
              {item.kanji}
            </span>
          ),
        )}
      </div>
    </div>
  )
}
