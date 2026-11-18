import { useEffect, useRef } from 'react'
import { contact, nav, sections, type SectionId } from '../data/content'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useProximityWeight } from '../hooks/useProximityWeight'
import { Logo } from './Logo'
import { RollText } from './RollText'
import styles from './Footer.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

export function Footer() {
  const brandRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)
  const year = new Date().getFullYear()

  // peso variável por proximidade nas letras da marca gigante (300 → 900)
  useProximityWeight(brandRef, { min: 300, max: 900 })

  // Mede a largura natural do texto a 100px e ajusta o font-size para preencher
  // exatamente 100vw. Remove a necessidade do divisor mágico no CSS.
  useEffect(() => {
    const el = brandRef.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = '100px'
      el.style.width = 'max-content'
      const rect = el.getBoundingClientRect()
      const pl = parseFloat(getComputedStyle(el).paddingLeft)
      const textWidth = rect.width - pl - parseFloat(getComputedStyle(el).paddingRight)
      el.style.width = ''
      // texto preenche de paddingLeft até a borda direita do viewport; o resto é clipado
      el.style.fontSize = `${((window.innerWidth - pl) / textWidth) * 100}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
  }

  // Canais sem href são decorativos e não renderizam link
  const channels = contact.channels.filter((ch) => ch.href)

  return (
    <footer id="rodape" className={styles.footer} data-tone="primary">
      <div className={`container-wide ${styles.inner}`}>
        {/* Grid de 4 colunas */}
        <div className={styles.grid}>
          {/* 1. Logo + tagline */}
          <div className={styles.col}>
            <Logo />
            <p className={styles.tagline}>
              Estúdio de desenvolvimento em Maringá, PR.
            </p>
          </div>

          {/* 2. Navegação */}
          <div className={styles.col}>
            <p className={styles.colLabel}>Navegação</p>
            <ul className={styles.colLinks}>
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={styles.colLink}>
                    <RollText>
                      <span className={styles.num}>
                        {pad(sections[item.section as SectionId])}
                      </span>
                      {item.label}
                    </RollText>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Contato */}
          <div className={styles.col}>
            <p className={styles.colLabel}>Contato</p>
            <ul className={styles.colLinks}>
              {channels.map((ch) => (
                <li key={ch.label}>
                  <a
                    href={ch.href}
                    target={ch.href.startsWith('http') ? '_blank' : undefined}
                    rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={styles.colLink}
                  >
                    <RollText>{ch.value}</RollText>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Voltar ao topo */}
          <div className={styles.col}>
            <p className={styles.colLabel}>Mais</p>
            <button onClick={scrollToTop} className={styles.topBtn}>
              <RollText>Voltar ao topo ↑</RollText>
            </button>
          </div>
        </div>

        {/* Linha de copyright */}
        <div className={styles.bar}>
          <span>© {year} Wa Labs</span>
          <span>Feito em harmonia — 和</span>
        </div>
      </div>

      {/* Marca gigante — decorativa, fora do container pra preencher a tela */}
      <div
        ref={brandRef}
        className={styles.brand}
        aria-hidden="true"
      >
        {'WA LABS 和'.split('').map((char, i) => (
          <span key={i} data-proximity="" className={styles.brandChar}>
            {char}
          </span>
        ))}
      </div>
    </footer>
  )
}
