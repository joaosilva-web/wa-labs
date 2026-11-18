import { useEffect, useRef, type CSSProperties } from 'react'
import { about, sections } from '../data/content'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { SectionMeta } from './SectionMeta'
import styles from './About.module.css'

export function About() {
  const revealRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)

  useEffect(() => {
    const el = revealRef.current
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

  return (
    <section id="sobre" className={styles.about} data-tone="dark">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.sobre}
          label={about.label}
          aside={about.aside}
          tone="dark"
        />

        <div ref={revealRef} className={styles.body}>
          {/* Coluna foto */}
          <div className={styles.photoCol} style={{ '--i': 0 } as CSSProperties}>
            <div className={styles.photoWrap}>
              <img
                src={about.photo.src}
                alt={about.photo.alt}
                width={about.photo.width}
                height={about.photo.height}
                loading="lazy"
                decoding="async"
                className={styles.photo}
                onError={(e) => {
                  const img = e.currentTarget
                  img.style.display = 'none'
                  const fallback = img.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.removeAttribute('hidden')
                }}
              />
              {/* Fallback: 和 kanji sobre fundo verde */}
              <div className={styles.photoFallback} hidden aria-hidden="true">
                和
              </div>
            </div>
          </div>

          {/* Coluna texto */}
          <div className={styles.textCol}>
            <h2 className={styles.title} style={{ '--i': 1 } as CSSProperties}>
              <span className={styles.light}>{about.title[0].text}</span>
              <span className={styles.heavy}>{about.title[1].text}</span>
            </h2>

            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className={styles.paragraph}
                style={{ '--i': i + 2 } as CSSProperties}
              >
                {p}
              </p>
            ))}

            <dl className={styles.facts} style={{ '--i': about.paragraphs.length + 2 } as CSSProperties}>
              {about.facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Bloco "Por que Wa?" — largura total, abaixo das colunas */}
        <div className={styles.why} style={{ '--i': about.paragraphs.length + 3 } as CSSProperties}>
          <div className={styles.whyLeft} aria-hidden="true">
            <span className={styles.whyKanji}>{about.why.kanji}</span>
            <span className={styles.whyReading}>{about.why.kanjiReading}</span>
          </div>
          <div className={styles.whyRight}>
            <h3 className={styles.whyTitle}>{about.why.title}</h3>
            <p className={styles.whyText}>{about.why.text}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
