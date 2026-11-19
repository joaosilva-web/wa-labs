import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { buildGlassMap, supportsRefraction } from '../utils/liquidGlass'

type Props = {
  src: string
  className?: string
  /** Classe da <img> interna (ex.: a mesma da foto, pra herdar o parallax). */
  imgClassName?: string
  /** Largura da faixa da borda que refrata (px). */
  bevel?: number
  /** Força da refração (scale do feDisplacementMap). */
  scale?: number
  /** Franja cromática: R, G e B em scale −1 / scale / scale +1. */
  chromatic?: boolean
  saturate?: number
  brightness?: number
  /** Sem refração (fora do Chromium): vidro fosco leve. */
  fallbackBlur?: number
}

/** Matrizes que isolam R, G e B (mesmas do LiquidGlass). */
const CHANNEL = [
  '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
] as const

/**
 * Lente de vidro sobre uma imagem que é nossa (a foto do Sobre): uma cópia da imagem
 * com `filter: url(#…)` usando o mesmo mapa de bisel do LiquidGlass (buildGlassMap).
 *
 * Por que não backdrop-filter: dentro de uma carta que gira em 3D, o Chrome refaz o
 * backdrop-filter a cada frame (com a franja cromática, ~30fps), e com overflow
 * arredondado no pai a refração nem aparece. Um filter comum é rasterizado uma vez,
 * no plano da carta, e gira junto como camada pronta.
 *
 * O mapa assume um stadium (border-radius: 999px) do tamanho do elemento.
 * Decorativa: aria-hidden e alt vazio.
 */
export function CardLens({
  src,
  className = '',
  imgClassName = '',
  bevel = 48,
  scale = 90,
  chromatic = false,
  saturate = 1.1,
  brightness = 1.02,
  fallbackBlur = 2,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const id = `lens-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const refraction = useMemo(() => supportsRefraction(), [])
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!refraction || !el) return
    let timer = 0
    let first = true
    const ro = new ResizeObserver(() => {
      // offsetWidth/Height: tamanho de layout, sem o transform da carta
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (!w || !h) return
      const apply = () => setSize((p) => (p && p.w === w && p.h === h ? p : { w, h }))
      clearTimeout(timer)
      if (first) {
        first = false
        apply()
      } else {
        timer = window.setTimeout(apply, 150)
      }
    })
    ro.observe(el)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
    }
  }, [refraction])

  const map = useMemo(
    () => (refraction && size ? buildGlassMap(size.w, size.h, bevel) : ''),
    [refraction, size, bevel],
  )
  const live = refraction && !!map && !!size

  const scales = chromatic ? [scale - 1, scale, scale + 1] : [scale]
  const filter = live
    ? `url(#${id}) saturate(${saturate}) brightness(${brightness})`
    : `blur(${fallbackBlur}px) saturate(${saturate})`

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {live && (
        <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
          <filter
            id={id}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              preserveAspectRatio="none"
              result="map"
            />
            {scales.length === 1 ? (
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scales[0]}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            ) : (
              <>
                {scales.map((s, i) => (
                  <Fragment key={i}>
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="map"
                      scale={s}
                      xChannelSelector="R"
                      yChannelSelector="G"
                      result={`d${i}`}
                    />
                    <feColorMatrix in={`d${i}`} type="matrix" values={CHANNEL[i]} result={`c${i}`} />
                  </Fragment>
                ))}
                <feBlend in="c0" in2="c1" mode="screen" result="rg" />
                <feBlend in="rg" in2="c2" mode="screen" />
              </>
            )}
          </filter>
        </svg>
      )}
      <div style={{ position: 'absolute', inset: 0, filter } as CSSProperties}>
        <img src={src} alt="" className={imgClassName} decoding="async" />
      </div>
    </div>
  )
}
