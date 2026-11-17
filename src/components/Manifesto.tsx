import { manifesto } from '../data/content'
import styles from './Manifesto.module.css'

/** Seção escura que recebe a transição da hero (o fim da hero já é dessa cor). */
export function Manifesto() {
  const year = new Date().getFullYear()

  return (
    <section id="manifesto" className={styles.manifesto}>
      <div className={`container-wide ${styles.inner}`}>
        <div className={styles.meta}>
          <span>{manifesto.label}</span>
          <span>
            {manifesto.metaPrefix} — {year}
          </span>
        </div>

        <h2 className={styles.title}>
          {manifesto.lines.map((line, i) => (
            <span key={i} className={styles.line}>
              {line}
            </span>
          ))}
        </h2>
      </div>
    </section>
  )
}
