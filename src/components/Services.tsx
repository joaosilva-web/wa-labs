import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { marquee, sections, services, servicesSection as copy } from '../data/content'
import { REDUCED_MOTION, useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import { Marquee } from './Marquee'
import { RollText } from './RollText'
import { SectionMeta } from './SectionMeta'
import { ServicePreview } from './ServicePreview'
import styles from './Services.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

export function Services() {
  const listRef = useRef<HTMLOListElement>(null)
  const pointerFx = usePointerEffects()
  const reduced = useMediaQuery(REDUCED_MOTION)
  // muda só ao trocar de linha (nada por frame)
  const [active, setActive] = useState(0)

  // Entrada: uma vez só, quando a lista aparece (marcada no DOM, sem re-render)
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (reduced) {
      list.setAttribute('data-revealed', '')
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        list.setAttribute('data-revealed', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(list)
    return () => io.disconnect()
  }, [reduced])

  return (
    <section id="servicos" className={styles.services} data-tone="dark">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.servicos}
          label={copy.label}
          aside={`${pad(services.length)} ${copy.countLabel}`}
          tone="dark"
        />

        <div className={styles.head}>
          <h2 className={styles.title}>
            <span className={styles.light}>{copy.title[0]}</span>
            <span className={styles.heavy}>{copy.title[1]}</span>
          </h2>
          <p className={styles.lead}>{copy.lead}</p>
        </div>

        <ol ref={listRef} className={styles.list} data-fx={pointerFx || undefined}>
          {services.map((service, i) => (
            <li key={service.title} className={styles.item} style={{ '--i': i } as CSSProperties}>
              <a
                href={copy.href}
                className={styles.row}
                data-cursor="hover"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className={styles.num}>{pad(i + 1)}</span>

                <span className={styles.kanjiCol} aria-hidden="true">
                  <span className={styles.kanji}>{service.kanji}</span>
                  <span className={styles.reading}>
                    {service.reading} · {service.meaning}
                  </span>
                </span>

                <div className={styles.body}>
                  <h3 className={styles.serviceTitle}>
                    {/* sem hover (touch) o título quebra linha normalmente */}
                    {pointerFx ? <RollText>{service.title}</RollText> : service.title}
                  </h3>
                  <p className={styles.description}>{service.description}</p>
                </div>

                <ul className={styles.tags}>
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>

                <span className={styles.arrow} aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <ServicePreview items={services} active={active} trackRef={listRef} />

      <Marquee items={marquee} label={`${copy.marqueeIntro} ${marquee.join(', ')}.`} />
    </section>
  )
}
