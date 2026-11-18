import {
  forwardRef,
  Fragment,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { buildGlassMap, supportsRefraction } from '../utils/liquidGlass'
import styles from './LiquidGlass.module.css'

type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: ReactNode
  /** Camada entre o vidro e o tint (ex.: a mídia da pílula dos serviços). */
  underlay?: ReactNode
  /** Largura da faixa da borda que refrata (px). */
  bevel?: number
  /** Força da refração (scale do feDisplacementMap). */
  scale?: number
  /** Franja cromática: R, G e B deslocados em scale −1 / scale / scale +1. */
  chromatic?: boolean
  /** Blur leve por cima da refração (px). */
  blur?: number
  saturate?: number
  brightness?: number
  /** Vidro fosco (sem refração): blur em px e saturação. */
  fallbackBlur?: number
  fallbackSaturate?: number
  /** false força o fosco mesmo no Chromium (ex.: celular, performance). */
  refraction?: boolean
}

/** Matrizes que isolam R, G e B (pra franja cromática). */
const CHANNEL = [
  '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
] as const

/** Mapas já gerados, por w×h×bevel: o header alterna entre dois tamanhos e não refaz. */
const mapCache = new Map<string, string>()
function glassMap(w: number, h: number, bevel: number) {
  const key = `${w}x${h}x${bevel}`
  let map = mapCache.get(key)
  if (map === undefined) {
    map = buildGlassMap(w, h, bevel)
    mapCache.set(key, map)
  }
  return map
}

type Size = { w: number; h: number }
const RESIZE_DEBOUNCE = 150

/**
 * Vidro líquido reutilizável. Camadas: glass (backdrop-filter) → underlay → tint → shine → children.
 * O mapa de refração assume um stadium (border-radius: 999px) e é gerado no tamanho medido.
 *
 * Fade: nunca ponha opacity < 1 (nem filter/mask/clip-path) neste elemento ou num ancestral.
 * No Chromium isso cria um "backdrop root" e o vidro passa a refratar o nada; faça fade nas camadas.
 *
 * CSS vars de material (podem vir do pai):
 *   --lg-tint           cor sólida do tint  (padrão: branco 6%)
 *   --lg-tint-image     gradiente adicional no tint  (padrão: none)
 *   --lg-edge           força da borda de luz branca  (padrão: 1); ignorada quando --lg-rim está definida
 *   --lg-rim            substitui todo o box-shadow do tint (bordas escuras p/ fundo claro)
 *   --lg-shine          opacidade do reflexo especular  (padrão: 1)
 *   --lg-blur           blur por cima da refração em px  (padrão: valor da prop `blur`)
 *   --lg-saturate       saturação do filtro  (padrão: valor da prop `saturate`)
 *   --lg-brightness     brilho do filtro  (padrão: valor da prop `brightness`)
 *   --lg-fallback-blur  blur do vidro fosco em px  (padrão: valor da prop `fallbackBlur`)
 *   --lg-fallback-saturate  saturação do fosco  (padrão: valor da prop `fallbackSaturate`)
 */
export const LiquidGlass = forwardRef<HTMLDivElement, Props>(function LiquidGlass(
  {
    children,
    underlay,
    bevel = 20,
    scale = 36,
    chromatic = false,
    blur = 1.5,
    saturate = 1.25,
    brightness = 1.03,
    fallbackBlur = 14,
    fallbackSaturate = 1.8,
    refraction: allowRefraction = true,
    className = '',
    style,
    ...rest
  },
  forwardedRef,
) {
  const ref = useRef<HTMLDivElement>(null)
  useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement)

  // useId tem ":" (inválido em url(#…) sem escape): fica só com o que serve de id
  const id = `lg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const refraction = useMemo(() => allowRefraction && supportsRefraction(), [allowRefraction])
  const [size, setSize] = useState<Size | null>(null)

  // Mede o próprio elemento: a primeira medida aplica na hora, as seguintes com debounce
  useEffect(() => {
    const el = ref.current
    if (!refraction || !el) return
    let timer = 0
    let first = true
    const apply = (w: number, h: number) =>
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    const ro = new ResizeObserver(([entry]) => {
      // offsetWidth/Height: tamanho de layout, sem transform (a pílula estica com scale)
      const w = Math.round(el.offsetWidth || entry.contentRect.width)
      const h = Math.round(el.offsetHeight || entry.contentRect.height)
      if (!w || !h) return
      clearTimeout(timer)
      if (first) {
        first = false
        apply(w, h)
      } else {
        timer = window.setTimeout(() => apply(w, h), RESIZE_DEBOUNCE)
      }
    })
    ro.observe(el)
    return () => {
      clearTimeout(timer)
      ro.disconnect()
    }
  }, [refraction])

  const map = useMemo(
    () => (refraction && size ? glassMap(size.w, size.h, bevel) : ''),
    [refraction, size, bevel],
  )
  const live = refraction && !!map && !!size

  const scales = chromatic ? [scale - 1, scale, scale + 1] : [scale]
  // Valores das props viram defaults das CSS vars: o pai substitui por tom sem re-render.
  const filter = live
    ? `url(#${id}) blur(var(--lg-blur, ${blur}px)) saturate(var(--lg-saturate, ${saturate})) brightness(var(--lg-brightness, ${brightness}))`
    : `blur(var(--lg-fallback-blur, ${fallbackBlur}px)) saturate(var(--lg-fallback-saturate, ${fallbackSaturate}))`

  return (
    <div
      ref={ref}
      className={`${styles.root} ${className}`}
      style={style}
      data-refraction={live || undefined}
      {...rest}
    >
      {live && (
        <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
          <filter
            id={id}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            // sRGB: senão o 128 do mapa deixa de ser "zero" na conversão pra linearRGB
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

      <div
        className={styles.glass}
        data-layer=""
        style={{ backdropFilter: filter, WebkitBackdropFilter: filter } as CSSProperties}
      />
      {underlay}
      <div className={styles.tint} data-layer="" />
      <div className={styles.shine} data-layer="" />
      {children}
    </div>
  )
})
