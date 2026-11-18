import { useEffect, useRef, useState } from 'react'
import { nav, sectionNumber } from '../data/content'
import { useHeaderTone } from '../hooks/useHeaderTone'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Button } from './Button'
import { LiquidGlass } from './LiquidGlass'
import { Logo } from './Logo'
import styles from './Header.module.css'

/** Distância do topo da tela e altura da cápsula (iguais ao CSS). */
const TOP = 16
const HEIGHT = 64
/** Faixa de ~40px observada pra descobrir o tom: centrada na cápsula. */
const BAND = 40
/** Depois disso a cápsula encolhe. */
const COMPACT_AFTER = 80
/**
 * Refração no desktop. Se rolar a página cair de ~60fps no Chrome, desligue aqui:
 * o header fica só fosco (com borda de luz e reflexo) e a pílula dos serviços não muda.
 */
const HEADER_REFRACTION = true

/** Cápsula flutuante de vidro líquido; o tom segue a seção que está embaixo. */
export function Header() {
  const headerRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const mobile = useMediaQuery('(max-width: 760px)')
  // abaixo de 861px só o fosco: refratar a cada frame de scroll pesa demais no celular
  const wide = useMediaQuery('(min-width: 861px)')
  // scale maior no tom light: o bisel entorta as linhas finas da espiral de forma visível
  const [capsuleScale, setCapsuleScale] = useState(38)
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const update = () => setCapsuleScale(header.dataset.tone === 'light' ? 38 : 28)
    const mo = new MutationObserver(update)
    mo.observe(header, { attributes: true, attributeFilter: ['data-tone'] })
    return () => mo.disconnect()
  }, [])

  useHeaderTone(headerRef, { bandTop: TOP + HEIGHT / 2 - BAND / 2, bandHeight: BAND })

  // Encolhe depois de 80px de scroll (atributo só muda ao cruzar o limite)
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    let frame = 0
    const update = () => {
      frame = 0
      header.toggleAttribute('data-compact', window.scrollY > COMPACT_AFTER)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
    }
  }, [])

  // Menu: fecha ao virar desktop e com Esc
  useEffect(() => {
    if (!mobile) setOpen(false)
  }, [mobile])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  const navigation = (
    <nav className={styles.nav} aria-label="Principal">
      <ul>
        {nav.map((item) => (
          <li key={item.href}>
            <a href={item.href} onClick={close}>
              <sup className={styles.num} aria-hidden="true">
                {sectionNumber(item.section)}
              </sup>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <Button href="#contato" className={styles.cta} onClick={close}>
        Orçamento
      </Button>
    </nav>
  )

  return (
    <header ref={headerRef} className={styles.header} data-tone="light" data-open={open || undefined}>
      <LiquidGlass
        className={styles.capsule}
        bevel={16}
        scale={capsuleScale}
        refraction={wide && HEADER_REFRACTION}
      >
        <div className={styles.inner}>
          <span className={styles.brand}>
            <Logo />
          </span>

          {mobile ? (
            <button
              className={styles.toggle}
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className={styles.srOnly}>{open ? 'Fechar menu' : 'Abrir menu'}</span>
              <span className={styles.bar} />
              <span className={styles.bar} />
            </button>
          ) : (
            navigation
          )}
        </div>
      </LiquidGlass>

      {mobile && (
        // card de vidro logo abaixo da cápsula (só fosco: é sempre < 861px)
        <LiquidGlass
          id="menu"
          className={styles.menu}
          refraction={false}
          hidden={!open}
        >
          <div className={styles.menuInner}>{navigation}</div>
        </LiquidGlass>
      )}
    </header>
  )
}
