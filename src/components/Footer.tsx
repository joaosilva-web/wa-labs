import { useRef } from 'react'
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
  }

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
              {contact.channels.map((ch) => (
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
