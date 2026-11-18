import { useEffect, useRef, useState } from 'react'
import { contact } from '../data/content'
import { useLoader } from '../context/LoaderContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useToneObserver } from '../hooks/useToneObserver'
import { LiquidGlass } from './LiquidGlass'
import styles from './FloatingWhatsApp.module.css'

/**
 * Botão flutuante de WhatsApp em Liquid Glass.
 *
 * Aparece após a hero sair da tela; some quando a seção Contato estiver visível
 * (ela já tem o link de WhatsApp) e enquanto o preloader estiver ativo.
 *
 * Tom automático: segue a seção sob o botão, igual ao header.
 *
 * Fade: nunca com opacity no elemento do LiquidGlass ou num ancestral.
 * No Chromium opacity < 1 num ancestral cria "backdrop root" e o vidro refrataria o nada.
 * O scale no wrapper é seguro; a opacidade fica nas camadas internas (via CSS).
 */
export function FloatingWhatsApp() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { isDone } = useLoader()
  // abaixo de 861px só fosco; refração pesada em dois elementos glass simultâneos
  const wide = useMediaQuery('(min-width: 861px)')
  const [expanded, setExpanded] = useState(false)
  const [heroGone, setHeroGone] = useState(false)
  const [contactVisible, setContactVisible] = useState(false)

  // tom conforme a seção que está atrás do botão (canto inferior direito da tela)
  useToneObserver(wrapperRef, { bandBottom: 72, bandHeight: 56 })

  // mostra após a hero sair da tela
  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero) return
    const io = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting))
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // some quando a seção Contato está visível (ela já tem o WhatsApp)
  useEffect(() => {
    const contato = document.getElementById('contato')
    if (!contato) return
    const io = new IntersectionObserver(
      ([e]) => setContactVisible(e.isIntersecting),
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(contato)
    return () => io.disconnect()
  }, [])

  const shown = isDone && heroGone && !contactVisible

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      data-tone="light"
      data-shown={shown || undefined}
      data-expanded={expanded || undefined}
      onMouseEnter={() => wide && setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <LiquidGlass
        className={styles.fab}
        bevel={14}
        scale={30}
        refraction={wide}
        fallbackBlur={14}
        fallbackSaturate={1.6}
        aria-label="Conversar no WhatsApp (abre em nova aba)"
        role="link"
      >
        <a
          href={contact.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar no WhatsApp (abre em nova aba)"
          data-cursor="hover"
          className={styles.link}
          tabIndex={shown ? 0 : -1}
        >
          {/* ícone balão de conversa, traço */}
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className={styles.label} aria-hidden="true">
            Fale com a gente
          </span>
        </a>

        {/* indicador "online" */}
        <span className={styles.dot} aria-hidden="true" />
      </LiquidGlass>
    </div>
  )
}
