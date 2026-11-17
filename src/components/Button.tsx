import type { AnchorHTMLAttributes } from 'react'
import { RollText } from './RollText'
import styles from './Button.module.css'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** `link` = texto sublinhado, sem fundo (ex.: "Ver serviços ↓") */
  variant?: 'primary' | 'ghost' | 'inverse' | 'link'
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <a className={`${styles.button} ${styles[variant]} ${className}`} {...rest}>
      <RollText>{children}</RollText>
    </a>
  )
}
