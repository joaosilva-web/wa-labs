import { Fragment, useRef, type CSSProperties } from 'react'
import { manifesto, sections } from '../data/content'
import { useViewProgress } from '../hooks/useViewProgress'
import { Enso } from './Enso'
import { SectionMeta } from './SectionMeta'
import styles from './Manifesto.module.css'

const words = manifesto.paragraph.split(' ')
const highlight = manifesto.highlight.split(' ')
const total = words.length + highlight.length
const fullText = `${manifesto.paragraph} ${manifesto.highlight}`

/** Seção escura que recebe a transição da hero (o fim da hero já é dessa cor). */
export function Manifesto() {
  const year = new Date().getFullYear()
  const paragraphRef = useRef<HTMLParagraphElement>(null)
  const ensoTrackRef = useRef<HTMLDivElement>(null)

  // --p no parágrafo: as palavras acendem (topo a 85% → fundo a 45% da tela)
  useViewProgress(paragraphRef)
  // o ensō usa o MESMO progresso do parágrafo (--enso-p no trilho); o CSS converte
  // pra terminar exatamente quando o destaque final completa
  useViewProgress(paragraphRef, { varName: '--enso-p', targetRef: ensoTrackRef })

  return (
    <section id="manifesto" className={styles.manifesto}>
      {/* trilho da altura da seção: o ensō fica sticky no centro da tela enquanto ela passa */}
      <div
        ref={ensoTrackRef}
        className={styles.ensoTrack}
        style={{ '--n': total } as CSSProperties}
        aria-hidden="true"
      >
        <Enso className={styles.enso} />
      </div>

      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.manifesto}
          label={manifesto.label}
          aside={`${manifesto.metaPrefix} — ${year}`}
          tone="dark"
        />

        <h2 className={styles.title}>
          {manifesto.lines.map((line, i) => (
            <span key={i} className={styles.line}>
              {line}
            </span>
          ))}
        </h2>

        <p ref={paragraphRef} className={styles.paragraph} style={{ '--n': total } as CSSProperties}>
          <span className={styles.srOnly}>{fullText}</span>
          <span aria-hidden="true">
            {words.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className={styles.word} style={{ '--i': i } as CSSProperties}>
                  {word}
                </span>
              </Fragment>
            ))}{' '}
            {highlight.map((word, j) => (
              <Fragment key={`h${j}`}>
                {j > 0 && ' '}
                <span
                  className={`${styles.word} ${styles.hl} ${j === highlight.length - 1 ? styles.hlLast : ''}`}
                  style={{ '--i': words.length + j } as CSSProperties}
                >
                  {word}
                </span>
              </Fragment>
            ))}
          </span>
        </p>

        <p className={styles.signature}>{manifesto.signature}</p>
      </div>
    </section>
  )
}
