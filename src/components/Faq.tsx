import { useRef, type CSSProperties } from 'react'
import { faq, sections } from '../data/content'
import { useViewProgress } from '../hooks/useViewProgress'
import { RollText } from './RollText'
import { SectionMeta } from './SectionMeta'
import styles from './Faq.module.css'

// FAQ: seção 4 (par → normal): título da esquerda, texto da direita.
// Itens alternam esquerda/direita.
const ITEM_DIR = ['left', 'right'] as const

export function Faq() {
  const listColRef = useRef<HTMLDivElement>(null)

  /* --faq (0→1) na listCol: impulsiona peso do título e barra de progresso */
  useViewProgress(listColRef, { varName: '--faq', start: 0.9, end: 0.1 })

  return (
    <section id="duvidas" className={styles.faq} data-tone="light">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.duvidas}
          label={faq.label}
          aside={faq.aside}
          tone="light"
        />

        <div className={styles.body}>
          {/* Título — sticky na desktop; .titleCol não recebe data-reveal (é sticky).
              O h2 dentro recebe: seção 4 normal → título da esquerda. */}
          <div className={styles.titleCol}>
            <h2 className={styles.title} data-reveal="left" data-reveal-title="">
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
                data-reveal={ITEM_DIR[i % 2]}
                style={{ '--reveal-delay': `${i * 90}ms` } as CSSProperties}
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

            {/* texto da direita (seção 4 normal) */}
            <p
              className={styles.footer}
              data-reveal="right"
              style={{ '--reveal-delay': `${faq.items.length * 90}ms` } as CSSProperties}
            >
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
