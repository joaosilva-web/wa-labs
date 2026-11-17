import { contact } from '../data/content'
import { Button } from './Button'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <section id="contato" className="section">
      <div className="container">
        <div className={styles.box}>
          <h2 className={styles.title}>{contact.title}</h2>
          <p className={styles.subtitle}>{contact.subtitle}</p>
          <div className={styles.actions}>
            <Button href={contact.whatsapp} target="_blank" rel="noreferrer" variant="inverse">
              Chamar no WhatsApp
            </Button>
            <a className={styles.email} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
