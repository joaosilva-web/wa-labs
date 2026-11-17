import { Logo } from './Logo'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Logo />
        <p className={styles.copy}>
          © {new Date().getFullYear()} Wa Labs · Maringá, PR
        </p>
      </div>
    </footer>
  )
}
