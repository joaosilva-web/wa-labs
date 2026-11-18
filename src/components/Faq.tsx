import { useEffect, useRef, type CSSProperties } from 'react'
import { faq, sections } from '../data/content'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useViewProgress } from '../hooks/useViewProgress'
import { RollText } from './RollText'
import { SectionMeta } from './SectionMeta'
import styles from './Faq.module.css'

export function Faq() {
  const bodyRef = useRef<HTMLDivElement>(null)
  const listColRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)

  /* --- Reveal inicial do body (uma vez) ----------------------------- */
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (reduced) { el.setAttribute('data-revealed', ''); return }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.setAttribute('data-revealed', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  /* --- --faq (0→1) na listCol: impulsiona peso do título e barra ----- */
  useViewProgress(listColRef, { varName: '--faq', start: 0.9, end: 0.1 })

  /* --- Entrada por item: cada <details> tem seu próprio IO ----------- */
  useEffect(() => {
    const listCol = listColRef.current
    if (!listCol) return
    const items = [...listCol.querySelectorAll<HTMLElement>(`.${styles.item}`)]
    if (reduced) {
      items.forEach((el) => el.setAttribute('data-revealed', ''))
      return
    }
    const observers = items.map((el) => {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          el.setAttribute('data-revealed', '')
          io.disconnect()
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      io.observe(el)
      return io
    })
    return () => observers.forEach((io) => io.disconnect())
  }, [reduced])

  return (
    <section id="duvidas" className={styles.faq} data-tone="light">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.duvidas}
          label={faq.label}
          aside={faq.aside}
          tone="light"
        />

        <div ref={bodyRef} className={styles.body}>
          {/* Título — sticky na desktop, peso do .heavy cresce com --faq */}
          <div className={styles.titleCol} style={{ '--i': 0 } as CSSProperties}>
            <h2 className={styles.title}>
              {faq.title.map((seg, i) => (
                <span key={i} className={seg.weight === 'light' ? styles.light : styles.heavy}>
                  {seg.text}
                </span>
              ))}
            </h2>
          </div>

          {/* Lista de perguntas */}
          <div ref={listColRef} className={styles.listCol}>
            {/* Barra de progresso vertical */}
            <div className={styles.progressBar} aria-hidden="true" />

            {faq.items.map((item, i) => (
              <details
                key={i}
                className={styles.item}
                style={{ '--i': i + 1 } as CSSProperties}
              >
                {/*
                  data-roll: ativa o RollText no hover (via CSS selector
                  :is([data-roll]):is(:hover, :focus-visible) .char em RollText.module.css)
                */}
                <summary className={styles.summary} data-roll="">
                  <span className={styles.questionKanji} aria-hidden="true">問</span>
                  <span className={styles.question}>
                    <RollText>{item.q}</RollText>
                  </span>
                  <span className={styles.toggle} aria-hidden="true">+</span>
                </summary>
                <div className={styles.answer}>
                  <span className={styles.answerKanji} aria-hidden="true">答</span>
                  <p className={styles.answerText}>{item.a}</p>
                </div>
              </details>
            ))}

            <p className={styles.footer} style={{ '--i': faq.items.length + 1 } as CSSProperties}>
              {faq.footer.text}{' '}
              <a href={faq.footer.href} className={styles.footerLink} data-cursor="hover">
                <RollText>{faq.footer.cta}</RollText>
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
