import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useLoader } from '../context/LoaderContext'
import { hero, heroReel, type TitleSegment } from '../data/content'
import { useClock } from '../hooks/useClock'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useProximityWeight } from '../hooks/useProximityWeight'
import { useReel } from '../hooks/useReel'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { Button } from './Button'
import { HeroLayer } from './HeroLayer'
import { HeroPill } from './HeroPill'
import { SpiralBackground } from './SpiralBackground'
import styles from './Hero.module.css'

const alignClass = {
  start: styles.alignStart,
  indent: styles.alignIndent,
  end: styles.alignEnd,
} as const

/** Texto leve quebrado em letras (pro peso por proximidade), com um wrapper nowrap por palavra. */
function SplitLetters({ text, dot }: { text: string; dot?: number }) {
  let offset = 0
  return text.split(' ').map((word, w) => {
    const start = offset
    offset += word.length + 1
    return (
      <Fragment key={w}>
        {w > 0 && ' '}
        <span className={styles.word}>
          {[...word].map((char, c) => (
            <span
              key={c}
              data-proximity=""
              className={start + c === dot ? `${styles.letter} ${styles.dot}` : styles.letter}
            >
              {char}
            </span>
          ))}
        </span>
      </Fragment>
    )
  })
}

function Segment({ segment, reelIndex }: { segment: TitleSegment; reelIndex: number }) {
  if ('pill' in segment) {
    // espaços em volta: quando a pílula some (< 480px) as palavras não grudam
    return (
      <>
        {' '}
        <HeroPill
          items={heroReel}
          active={reelIndex}
          badgePrefix={hero.pillBadgePrefix}
          className={styles.pillInline}
        />{' '}
      </>
    )
  }

  if (segment.weight === 'heavy') return <span className={styles.heavy}>{segment.text}</span>
  return <SplitLetters text={segment.text} dot={segment.dot} />
}

/** Mapeia p num trecho [a, b] → 0..1 */
const range = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)))
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Base da faixa onde o header lê o tom (16px do topo + metade da cápsula + 20px). */
const HEADER_BAND_BOTTOM = 68

export function Hero() {
  const wrapperRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  /** Topo da pílula em repouso, relativo ao sticky (px): diz quando a camada verde chega no header. */
  const pillTopRef = useRef(Infinity)
  const reduced = useMediaQuery(REDUCED_MOTION)
  const pinned = !reduced

  // Único estado React ligado ao scroll: muda só ao cruzar p = 0
  const [scrolled, setScrolled] = useState(false)
  // Espiral: para de desenhar quando o fade-out termina (muda só ao cruzar p = 0.3)
  const [spiralOn, setSpiralOn] = useState(true)

  const now = useClock('America/Sao_Paulo')
  const tokyo = useClock('Asia/Tokyo', { seconds: false })
  // Nada se move atrás do preloader: reel, peso e espiral começam quando ele termina
  const { isDone } = useLoader()
  const reelIndex = useReel(heroReel.length, 1200, scrolled || !isDone)
  useProximityWeight(stickyRef, { active: !scrolled && isDone })

  /** Mede a pílula visível "em repouso" (sem o translate da linha) relativa ao sticky. */
  const measurePill = useCallback(() => {
    const sticky = stickyRef.current
    if (!sticky) return
    const body = [...sticky.querySelectorAll<HTMLElement>('[data-pill-body]')].find(
      (el) => el.getClientRects().length > 0,
    )
    if (!body) return

    const line = body.closest<HTMLElement>(`.${styles.line}`)
    const shift = line ? new DOMMatrixReadOnly(getComputedStyle(line).transform).m41 : 0
    const s = sticky.getBoundingClientRect()
    const r = body.getBoundingClientRect()
    const set = (name: string, value: string) => sticky.style.setProperty(name, value)

    set('--pill-l', `${r.left - shift - s.left}px`)
    set('--pill-r', `${s.right - (r.right - shift)}px`)
    pillTopRef.current = r.top - s.top
    set('--pill-t', `${r.top - s.top}px`)
    set('--pill-b', `${s.bottom - r.bottom}px`)
    set('--pill-h', `${r.height}px`)
    set('--pill-follow', line ? '1' : '0')
    set('--pill-fs', getComputedStyle(body).fontSize)
  }, [])

  useEffect(() => {
    if (!pinned) return
    measurePill()
    const ro = new ResizeObserver(measurePill)
    if (stickyRef.current) ro.observe(stickyRef.current)
    document.fonts?.ready.then(measurePill)
    return () => ro.disconnect()
  }, [pinned, measurePill])

  useScrollProgress(
    wrapperRef,
    (p) => {
      const sticky = stickyRef.current
      if (!sticky) return
      // A animação em si é CSS: aqui só escrevemos --p
      sticky.style.setProperty('--p', p.toFixed(4))
      sticky.toggleAttribute('data-expanded', p > 0.2)
      // Header some entre 0.6 e 0.75 e volta depois que a hero passa (p = 1)
      document.documentElement.style.setProperty(
        '--header-hide',
        p < 1 ? range(p, 0.6, 0.75).toFixed(3) : '0',
      )
      // Tom pro header: a camada (verde) cobre o topo quando o inset de cima (--ct no CSS)
      // passa da faixa do header; o escurecimento (p ≥ 0.75) emenda com o Manifesto
      const top = pillTopRef.current * (1 - smoothstep(range(p, 0.2, 0.75)))
      const tone = p >= 0.75 ? 'dark' : p > 0.2 && top < HEADER_BAND_BOTTOM ? 'primary' : 'light'
      if (wrapperRef.current && wrapperRef.current.dataset.tone !== tone) {
        wrapperRef.current.dataset.tone = tone
      }
      setScrolled(p > 0)
      setSpiralOn(p < 0.3)
    },
    { pinnedRef: stickyRef, enabled: pinned },
  )

  // Sem pin (reduced motion / desmontagem): limpa o que foi escrito fora do React
  useEffect(() => {
    const sticky = stickyRef.current
    if (pinned) return
    sticky?.style.removeProperty('--p')
    sticky?.removeAttribute('data-expanded')
    if (wrapperRef.current) wrapperRef.current.dataset.tone = 'light'
    document.documentElement.style.removeProperty('--header-hide')
    setScrolled(false)
    setSpiralOn(true)
  }, [pinned])
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('--header-hide')
    },
    [],
  )

  const year = new Date().getFullYear()
  const { meta } = hero

  return (
    <section id="top" ref={wrapperRef} className={styles.hero} data-tone="light">
      <div ref={stickyRef} className={styles.sticky} data-revealed={isDone || undefined}>
        <SpiralBackground trackRef={stickyRef} active={spiralOn && isDone} />

        <div className={`container-wide ${styles.inner}`}>
          {/* 1. Barra de metadados */}
          <div className={styles.meta}>
            <span>{meta.brand}</span>
            <span className={styles.hideTablet}>{meta.studio}</span>
            <span className={styles.hideMobile}>{meta.location}</span>
            <span className={styles.now}>
              <span className={styles.liveDot} aria-hidden="true" />
              {meta.nowLabel} <time className={styles.clock}>{now}</time>
            </span>
            <span className={styles.hideTablet}>
              {meta.tokyoLabel} <time className={styles.clock}>{tokyo}</time>
            </span>
            <span className={styles.hideMobile}>
              {meta.yearPrefix} ©{year}
            </span>
          </div>

          {/* 2. Introdução + rótulo vertical */}
          <div className={styles.introRow}>
            <p className={styles.intro}>{hero.intro}</p>
            <span className={styles.vertical} aria-hidden="true">
              {hero.verticalLabel}
            </span>
          </div>

          {/* 3. Título gigante */}
          <div className={styles.titleWrap}>
            {/* Abaixo de 480px a pílula sai da linha e ganha a própria linha */}
            <HeroPill
              items={heroReel}
              active={reelIndex}
              badgePrefix={hero.pillBadgePrefix}
              className={styles.pillStandalone}
            />

            <h1 className={styles.title} aria-label={hero.titleLabel}>
              {hero.title.map((line, i) => (
                <span key={i} className={`${styles.line} ${alignClass[line.align]}`} aria-hidden="true">
                  {line.segments.map((segment, j) => (
                    <Segment key={j} segment={segment} reelIndex={reelIndex} />
                  ))}
                </span>
              ))}
            </h1>
          </div>

          {/* 5. Rodapé da hero */}
          <div className={styles.footer}>
            <div className={styles.lead}>
              <p className={styles.disciplines}>{hero.disciplines}</p>
              <p className={styles.subtitle}>{hero.subtitle}</p>
            </div>

            <div className={styles.actions}>
              <Button href={hero.primaryCta.href}>
                {hero.primaryCta.label} <span aria-hidden="true">↗</span>
              </Button>
              <Button variant="link" href={hero.secondaryCta.href}>
                {hero.secondaryCta.label} <span aria-hidden="true">↓</span>
              </Button>
              <span className={styles.scroll} aria-hidden="true">
                {hero.scrollLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Pílula → tela cheia → escuro (dirigido por --p) */}
        {pinned && <HeroLayer items={heroReel} active={reelIndex} />}
      </div>
    </section>
  )
}
