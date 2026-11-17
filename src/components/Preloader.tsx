import { useEffect, useRef, useState } from 'react'
import { KANJI_STROKES, KANJI_TRANSFORM, LOGO_PILL, LOGO_VIEWBOX } from '../assets/logoStrokes'
import { useLoader } from '../context/LoaderContext'
import { heroReel, preloader as copy } from '../data/content'
import styles from './Preloader.module.css'

/** full = primeira visita · quick = já viu nesta sessão · reduced = prefers-reduced-motion */
type Mode = 'full' | 'quick' | 'reduced'

const SEEN_KEY = 'wa-preloader-seen'
const MIN_DURATION = { full: 2400, quick: 800, reduced: 2400 } as const
const MAX_DURATION = 8000 // teto: depois disso força 100
const HOLD = 350
const CLOSE = 900
const CROSSFADE = 200
const REDUCED_FADE = 400

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function readMode(): Mode {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced'
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return 'quick'
  } catch {
    /* storage bloqueado: trata como primeira visita */
  }
  return 'full'
}

function preload(src: string) {
  return new Promise<void>((resolve) => {
    if (/\.mp4($|\?)/i.test(src)) {
      const video = document.createElement('video')
      video.preload = 'auto'
      video.muted = true
      video.oncanplaythrough = video.onerror = () => resolve()
      video.src = src
    } else {
      const img = new Image()
      img.onload = img.onerror = () => resolve()
      img.src = src
    }
  })
}

/** O que conta como "carregou de verdade". Cada tarefa vale uma fatia igual do progresso. */
function loadingTasks(): Promise<unknown>[] {
  return [
    document.fonts?.ready ?? Promise.resolve(),
    ...heroReel.filter((item) => item.src).map((item) => preload(item.src!)),
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener('load', r, { once: true })),
  ]
}

/** A pílula visível da hero (inline no desktop, solta no mobile). */
const findHeroPill = () =>
  [...document.querySelectorAll<HTMLElement>('[data-pill-body]')].find(
    (el) => el.getClientRects().length > 0,
  )

export function Preloader() {
  const { finish } = useLoader()
  const [mode] = useState<Mode>(readMode)

  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const digitsRef = useRef<(HTMLSpanElement | null)[]>([])
  const barRef = useRef<HTMLSpanElement>(null)
  const pillRef = useRef<SVGPathElement>(null)
  const strokesRef = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const html = document.documentElement
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    let raf = 0
    let cancelled = false

    // ----- trava o scroll e começa do topo -----
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    html.style.overflow = 'hidden'
    // o gutter reservado da barra de rolagem pinta o fundo do html: escuro como o loader
    html.style.background = 'var(--color-inverse-bg)'
    const unlock = () => {
      html.style.removeProperty('overflow')
      html.style.removeProperty('background')
    }

    // ----- traços: comprimento real de cada path -----
    const drawn = mode === 'full'
    const paths = [pillRef.current, ...strokesRef.current].filter(Boolean) as SVGPathElement[]
    const lengths = paths.map((p) => p.getTotalLength())
    paths.forEach((p, i) => {
      p.style.strokeDasharray = `${lengths[i]}`
      p.style.strokeDashoffset = drawn ? `${lengths[i]}` : '0'
      // linecap round desenha um ponto mesmo com traço de tamanho 0: esconde até começar
      p.style.opacity = drawn ? '0' : '1'
    })
    if (!drawn) root.style.setProperty('--fill', '1')

    // ----- progresso real -----
    const tasks = loadingTasks()
    let settled = 0
    const start = performance.now()
    let lastSettle = start
    tasks.forEach((t) =>
      t.finally(() => {
        settled++
        lastSettle = performance.now()
      }),
    )
    const minDuration = MIN_DURATION[mode]

    const target = (now: number) => {
      const elapsed = now - start
      let real: number
      if (elapsed >= MAX_DURATION || settled >= tasks.length) real = 100
      else {
        // dentro da fatia da tarefa atual, avança devagar até 90% dela (nunca trava parado)
        const creep = 0.9 * (1 - Math.exp(-(now - lastSettle) / 1200))
        real = ((settled + creep) / tasks.length) * 100
      }
      return Math.min(real, (elapsed / minDuration) * 100)
    }

    let shown = 0
    let last = -1

    const render = (value: number) => {
      const n = Math.floor(value)
      if (n === last) return
      last = n
      const text = String(n).padStart(3, '0')
      digitsRef.current.forEach((el, i) => {
        if (el) el.textContent = text[i]
      })
      root.setAttribute('aria-valuenow', String(n))
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`
      if (!drawn) return

      // 0–15%: pílula · 15–95%: 8 traços, uma fatia cada · 95–100%: preenchimento
      const slice = 80 / KANJI_STROKES.length
      paths.forEach((p, i) => {
        const f = i === 0 ? clamp01(value / 15) : clamp01((value - 15 - (i - 1) * slice) / slice)
        p.style.strokeDashoffset = `${lengths[i] * (1 - f)}`
        p.style.opacity = f > 0 ? '1' : '0'
      })
      root.style.setProperty('--fill', String(clamp01((value - 95) / 5)))
    }

    const finishAll = () => {
      if (cancelled) return
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* sem storage: próxima visita mostra o completo de novo */
      }
      finish()
    }

    const exit = () => {
      if (mode === 'reduced') {
        root.dataset.state = 'fading'
        unlock()
        later(finishAll, REDUCED_FADE)
        return
      }

      const pill = findHeroPill()
      const logo = logoRef.current
      if (!pill || !logo) {
        root.dataset.state = 'fading'
        unlock()
        later(finishAll, CROSSFADE)
        return
      }

      // fecha a tela cheia até o retângulo exato da pílula da hero
      const box = root.getBoundingClientRect()
      const p = pill.getBoundingClientRect()
      const l = logo.getBoundingClientRect()
      root.style.setProperty(
        '--clip',
        `inset(${p.top - box.top}px ${box.right - p.right}px ${box.bottom - p.bottom}px ${p.left - box.left}px round ${p.height / 2}px)`,
      )
      // o logo (mesma proporção da pílula) encolhe e encaixa nela
      root.style.setProperty('--logo-x', `${p.left + p.width / 2 - (l.left + l.width / 2)}px`)
      root.style.setProperty('--logo-y', `${p.top + p.height / 2 - (l.top + l.height / 2)}px`)
      root.style.setProperty('--logo-s', String(p.width / l.width))
      root.dataset.state = 'closing'
      html.style.removeProperty('background') // a hero aparece em volta: gutter volta ao claro

      later(() => {
        // encaixou: crossfade pro conteúdo da pílula (o 和 sobre verde) e desmonta
        root.dataset.state = 'fading'
        unlock()
        later(finishAll, CROSSFADE)
      }, CLOSE)
    }

    const tick = (now: number) => {
      const gap = target(Math.max(now, start)) - shown
      // persegue o alvo com easing e nunca anda pra trás; o passo mínimo (0.5/frame)
      // evita a cauda exponencial que deixaria o contador "parado" em 98–99
      if (gap > 0) shown += Math.min(gap, Math.max(gap * 0.12, 0.5))
      render(shown)
      if (shown >= 100) {
        later(exit, HOLD)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      unlock()
      delete root.dataset.state
    }
  }, [mode, finish])

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-mode={mode}
      role="progressbar"
      aria-label={copy.ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className={`${styles.corner} ${styles.topLeft}`} aria-hidden="true">
        <span>{copy.brand}</span>
        <span className={styles.dim}>{copy.studio}</span>
      </div>
      <div className={`${styles.corner} ${styles.topRight} ${styles.dim}`} aria-hidden="true">
        {copy.place}
      </div>

      <div ref={logoRef} className={styles.logo} aria-hidden="true">
        <svg viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`} className={styles.svg}>
          <path ref={pillRef} d={LOGO_PILL} className={styles.pill} data-stroke="pill" />
          <g transform={KANJI_TRANSFORM} className={styles.kanji}>
            {KANJI_STROKES.map((d, i) => (
              <path
                key={i}
                d={d}
                data-stroke={i + 1}
                // fill só faz sentido em forma fechada; num traço aberto ele pinta a "corda"
                data-closed={/z\s*$/i.test(d) || undefined}
                ref={(el) => {
                  strokesRef.current[i] = el
                }}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className={`${styles.corner} ${styles.bottomLeft}`} aria-hidden="true">
        {copy.footer}
      </div>
      <div className={styles.counter} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={styles.digit}
            ref={(el) => {
              digitsRef.current[i] = el
            }}
          >
            0
          </span>
        ))}
      </div>

      <span className={styles.track} aria-hidden="true">
        <span ref={barRef} className={styles.bar} />
      </span>
    </div>
  )
}
