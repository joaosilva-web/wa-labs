import { useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react'
import { process, processSection as copy, sections } from '../data/content'
import { scrollToY } from '../lenis'
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useCardTilt } from '../hooks/useCardTilt'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { useViewProgress } from '../hooks/useViewProgress'
import { LiquidGlass } from './LiquidGlass'
import { SectionMeta } from './SectionMeta'
import styles from './Process.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/* ---------------------------------------------------------------
 * StepItem — subcomponente isolado para que cada etapa tenha seus
 * próprios hooks de tilt (número e pílula independentes).
 * ------------------------------------------------------------- */
type StepItemProps = {
  item: (typeof process)[number]
  index: number
  isActive: boolean
  pinned: boolean
  scrolling: boolean
}

function StepItem({ item, isActive, pinned, scrolling }: StepItemProps) {
  const fine = useMediaQuery(FINE_POINTER)
  const reduced = useMediaQuery(REDUCED_MOTION)

  // Mantém o vidro montado enquanto --active transiciona de volta a 0 (~600ms)
  const wasActiveRef = useRef(false)
  const [showGlass, setShowGlass] = useState(false)

  useEffect(() => {
    if (!pinned) {
      // Mobile/reduced: nunca mostra vidro
      setShowGlass(false)
      wasActiveRef.current = false
      return
    }
    if (isActive) {
      wasActiveRef.current = true
      setShowGlass(true)
    } else if (wasActiveRef.current) {
      const t = setTimeout(() => {
        wasActiveRef.current = false
        setShowGlass(false)
      }, 650)
      return () => clearTimeout(t)
    }
  }, [isActive, pinned])

  const numberRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)

  const tiltOn = showGlass && !reduced
  useCardTilt(numberRef, { enabled: tiltOn })
  useCardTilt(pillRef, { enabled: tiltOn, maxRY: 8, maxRX: 6 })

  return (
    <li
      className={styles.step}
      data-active={!pinned || isActive || undefined}
    >
      {/* Número gigante */}
      <div ref={numberRef} className={styles.numberWrap}>
        <div className={styles.numberTiltInner}>
          <span className={styles.number} aria-hidden="true">
            {item.step}
          </span>
          {showGlass && (
            <span className={styles.numberGlass} aria-hidden="true">
              {item.step}
            </span>
          )}
          {showGlass && fine && !reduced && (
            <div className={styles.numberGlare} aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Kanji + leitura */}
      <div className={styles.kanjiRow}>
        <div ref={pillRef} className={styles.pillTiltOuter}>
          <div className={styles.pillTiltInner}>
            {showGlass ? (
              <LiquidGlass
                className={styles.pillGlass}
                bevel={48}
                scale={28}
                refraction={!scrolling}
              >
                <span className={styles.kanji}>{item.kanji}</span>
              </LiquidGlass>
            ) : (
              <span className={styles.pill} aria-hidden="true">
                <span className={styles.kanji}>{item.kanji}</span>
              </span>
            )}
          </div>
        </div>
        <span className={styles.reading}>
          <span lang="ja-Latn">{item.reading}</span> · {item.meaning}
        </span>
      </div>

      {/* Título + descrição + entregáveis */}
      <div className={styles.body}>
        <div>
          <h3 className={styles.stepTitle}>
            <span className={styles.srOnly}>{item.step}. </span>
            {item.title}
          </h3>
          <p className={styles.description}>{item.description}</p>
        </div>
        <ul className={styles.deliverables}>
          {item.deliverables.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </li>
  )
}

/** O trilho chega ao fim em 94% do trajeto: o último trecho segura a última etapa inteira na tela. */
const HOLD = 0.94

/** Medidas do trilho (no mount e no resize; nunca por frame). */
type Layout = {
  /** Quanto o trilho anda: largura dele menos a da tela (px). */
  travel: number
  /** Centro de cada etapa em relação à tela com o trilho em p = 0 (px). */
  centers: number[]
  /** Valor de p em que cada etapa fica mais perto do centro (posição dos marcadores). */
  stops: number[]
  half: number
}

/**
 * (02) Processo — fundo claro. No desktop a seção prende na tela e o scroll vertical
 * move as etapas na horizontal (linha do tempo). Progresso em --p (0 → 1) no sticky;
 * o React só re-renderiza quando a etapa ativa troca.
 * Mobile e reduced motion: lista vertical com uma linha que se desenha com o scroll.
 */
export function Process() {
  const wide = useMediaQuery('(min-width: 861px)')
  const reduced = useMediaQuery(REDUCED_MOTION)
  const pinned = wide && !reduced

  const wrapperRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const layout = useRef<Layout>({ travel: 0, centers: [], stops: [], half: 0 })
  const progress = useRef(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  // Rastrea se o trilho está se movendo (debounce 150ms) → pílula usa vidro fosco durante o scroll
  const scrollingRef = useRef(false)
  const scrollTimerRef = useRef(0)
  const [scrolling, setScrolling] = useState(false)

  const total = process.length

  const pickActive = useCallback((p: number) => {
    const { travel, centers, half } = layout.current
    if (!centers.length) return
    // etapa cujo centro está mais perto do centro da tela
    let best = 0
    let bestDist = Infinity
    centers.forEach((c, i) => {
      const d = Math.abs(c - p * travel - half)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    if (best !== activeRef.current) {
      activeRef.current = best
      setActive(best)
    }
  }, [])

  // medição: --travel e a posição dos marcadores
  const measure = useCallback(() => {
    const sticky = stickyRef.current
    const rail = railRef.current
    const list = listRef.current
    if (!sticky || !rail || !list) return
    const width = sticky.clientWidth
    const travel = Math.max(0, rail.scrollWidth - width)
    const railRect = rail.getBoundingClientRect()
    // left do trilho em p = 0 (desfaz o translate atual)
    const base = railRect.left - sticky.getBoundingClientRect().left + progress.current * travel
    const half = width / 2
    const centers = [...list.children].map((li) => {
      const r = li.getBoundingClientRect()
      return base + (r.left - railRect.left) + r.width / 2
    })
    const stops = centers.map((c) => (travel > 0 ? clamp01((c - half) / travel) : 0))
    layout.current = { travel, centers, stops, half }

    sticky.style.setProperty('--travel', `${travel}px`)
    stops.forEach((s, i) => sticky.style.setProperty(`--stop-${i}`, s.toFixed(4)))
    pickActive(progress.current)
  }, [pickActive])

  useEffect(() => {
    if (!pinned) return
    measure()
    const ro = new ResizeObserver(measure)
    if (stickyRef.current) ro.observe(stickyRef.current)
    if (railRef.current) ro.observe(railRef.current)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [pinned, measure])

  useScrollProgress(
    wrapperRef,
    (raw) => {
      const sticky = stickyRef.current
      if (!sticky) return
      const p = clamp01(raw / HOLD)
      progress.current = p
      sticky.style.setProperty('--p', p.toFixed(4))
      pickActive(p)
      // Debounce: scroll ativo → pílula usa frosted; parado → refração completa
      if (!scrollingRef.current) {
        scrollingRef.current = true
        setScrolling(true)
      }
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = window.setTimeout(() => {
        scrollingRef.current = false
        setScrolling(false)
      }, 150)
    },
    { pinnedRef: stickyRef, enabled: pinned },
  )

  // sem pin: limpa o que foi escrito fora do React e volta pra primeira etapa
  useEffect(() => {
    if (pinned) return
    const sticky = stickyRef.current
    sticky?.style.removeProperty('--p')
    sticky?.style.removeProperty('--travel')
    progress.current = 0
    activeRef.current = 0
    setActive(0)
  }, [pinned])

  // mobile / reduced motion: a linha vertical se desenha com a lista (fica inteira no reduced)
  useViewProgress(listRef, { varName: '--line', start: 0.8, end: 0.6 })

  // teclado: um focável fora da tela leva a página até a etapa dele
  const onFocus = (e: FocusEvent<HTMLOListElement>) => {
    if (!pinned) return
    const wrapper = wrapperRef.current
    const sticky = stickyRef.current
    const list = listRef.current
    if (!wrapper || !sticky || !list) return
    const index = [...list.children].findIndex((li) => li.contains(e.target))
    if (index < 0) return
    sticky.scrollLeft = 0 // o navegador não pode rolar o sticky por conta própria
    const pinTravel = wrapper.offsetHeight - sticky.offsetHeight
    const top = wrapper.getBoundingClientRect().top + window.scrollY
    scrollToY(top + layout.current.stops[index] * HOLD * pinTravel)
  }

  const counter = (
    <span className={styles.counter} aria-live="polite">
      <span aria-hidden="true">
        {pad(active + 1)} / {pad(total)}
      </span>
      <span className={styles.srOnly}>{copy.counterSr(active + 1, total)}</span>
    </span>
  )

  return (
    <section
      ref={wrapperRef}
      id="processo"
      className={styles.process}
      data-pinned={pinned || undefined}
      style={{ '--panels': total + 1 } as CSSProperties}
    >
      <div ref={stickyRef} className={styles.sticky}>
        <div className={`container-wide ${styles.meta}`}>
          <SectionMeta
            index={sections.processo}
            label={copy.label}
            aside={pinned ? counter : `${pad(total)} ${copy.countLabel}`}
            tone="light"
          />
        </div>

        <div className={styles.stage}>
          <div ref={railRef} className={styles.rail}>
            <div className={styles.opening}>
              <h2 className={styles.title}>
                <span className={styles.light}>{copy.title[0]}</span>{' '}
                <span className={styles.heavy}>{copy.title[1]}</span>
              </h2>
              {pinned && (
                <p className={styles.hint} aria-hidden="true">
                  <span className={styles.hintArrow}>→</span> {copy.scrollHint}
                </p>
              )}
            </div>

            <ol ref={listRef} className={styles.steps} onFocus={onFocus}>
              {process.map((item, i) => (
                <StepItem
                  key={item.step}
                  item={item}
                  index={i}
                  isActive={i === active}
                  pinned={pinned}
                  scrolling={scrolling}
                />
              ))}
            </ol>
          </div>
        </div>

        {pinned && (
          <div className={`container-wide ${styles.bar}`} aria-hidden="true">
            <span className={styles.barFill} />
            {process.map((item, i) => (
              <span
                key={item.step}
                className={styles.marker}
                style={{ '--at': `var(--stop-${i}, ${i / (total - 1)})` } as CSSProperties}
                data-done={i <= active || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
