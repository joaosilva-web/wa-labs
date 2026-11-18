import { useEffect, useRef } from 'react'
import { contact, nav, sections, type SectionId } from '../data/content'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useProximityWeight } from '../hooks/useProximityWeight'
import { Logo } from './Logo'
import { RollText } from './RollText'
import styles from './Footer.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)
  const year = new Date().getFullYear()

  // peso variável por proximidade nas letras da marca gigante (300 → 900)
  useProximityWeight(brandRef, { min: 300, max: 900 })

  // Ajusta o font-size da marca para preencher exatamente a área disponível do footer.
  // Mede no peso 900 (máximo do efeito de proximidade) para que o texto nunca
  // ultrapasse o espaço quando o cursor engrossa as letras.
  useEffect(() => {
    const el = brandRef.current
    const footer = footerRef.current
    if (!el || !footer) return

    let lastWidth = 0

    const fit = (force = false) => {
      const footerWidth = footer.clientWidth
      if (!force && footerWidth === lastWidth) return
      lastWidth = footerWidth

      // Força peso máximo em todos os chars para a medição mais conservadora
      const chars = el.querySelectorAll<HTMLElement>(`.${styles.brandChar}`)
      const saved = [...chars].map((c) => c.style.fontVariationSettings)
      chars.forEach((c) => { c.style.fontVariationSettings = '"wght" 900' })

      // Medição — tudo síncrono, sem await, sem paint intermediário
      el.style.fontSize = '100px'
      el.style.width = 'max-content'
      const cs = getComputedStyle(el)
      const pl = parseFloat(cs.paddingLeft)
      const pr = parseFloat(cs.paddingRight)
      const textWidth = el.getBoundingClientRect().width - pl - pr
      el.style.width = ''

      // Restaura pesos originais e aplica o tamanho calculado
      chars.forEach((c, i) => { c.style.fontVariationSettings = saved[i] })
      el.style.fontSize = `${((footerWidth - pl - pr) / textWidth) * 100}px`
    }

    fit()
    // Remede quando as fontes variáveis estiverem totalmente carregadas
    document.fonts.ready.then(() => fit(true))

    // Observa só o footer (não documentElement, que dispara em qualquer mudança de altura)
    const ro = new ResizeObserver(() => fit())
    ro.observe(footer)
    return () => ro.disconnect()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
  }

  // Canais sem href são decorativos e não renderizam link
  const channels = contact.channels.filter((ch) => ch.href)

  return (
    <footer ref={footerRef} id="rodape" className={styles.footer} data-tone="primary">
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
