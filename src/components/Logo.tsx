import styles from './Logo.module.css'

/**
 * Placeholder do logo.
 * Quando o 和 desenhado à mão estiver pronto, exporte como SVG
 * e substitua o <span className={styles.mark}> pelo <svg> aqui.
 */
export function Logo() {
  return (
    <a href="#top" className={styles.logo} aria-label="Wa Labs — início">
      <span className={styles.mark} aria-hidden="true">
        和
      </span>
      <span className={styles.word}>Wa Labs</span>
    </a>
  )
}
