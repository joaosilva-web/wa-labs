import { useState } from 'react'
import { nav } from '../data/content'
import { Button } from './Button'
import { Logo } from './Logo'
import styles from './Header.module.css'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={`container-wide ${styles.inner}`}>
        <Logo />

        <button
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.srOnly}>{open ? 'Fechar menu' : 'Abrir menu'}</span>
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>

        <nav id="menu" className={`${styles.nav} ${open ? styles.open : ''}`}>
          <ul>
            {nav.map((item, i) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)}>
                  <sup className={styles.num} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </sup>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Button href="#contato" onClick={() => setOpen(false)}>
            Orçamento
          </Button>
        </nav>
      </div>
    </header>
  )
}
