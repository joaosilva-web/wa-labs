import { process } from '../data/content'
import styles from './Process.module.css'

export function Process() {
  return (
    <section id="processo" className={`section ${styles.process}`}>
      <div className="container">
        <span className="eyebrow">Processo</span>
        <h2 className={styles.heading}>Simples, do começo ao fim</h2>

        <ol className={styles.steps}>
          {process.map((item) => (
            <li key={item.step} className={styles.step}>
              <span className={styles.number}>{item.step}</span>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.description}>{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
