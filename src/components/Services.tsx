import { services } from '../data/content'
import styles from './Services.module.css'

export function Services() {
  return (
    <section id="servicos" className="section">
      <div className="container">
        <span className="eyebrow">Serviços</span>
        <h2 className={styles.heading}>O que a gente constrói</h2>

        <ul className={styles.grid}>
          {services.map((service) => (
            <li key={service.title} className={styles.card}>
              <span className={styles.kanji} aria-hidden="true">
                {service.kanji}
              </span>
              <h3 className={styles.title}>{service.title}</h3>
              <p className={styles.description}>{service.description}</p>
              <ul className={styles.tags}>
                {service.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
