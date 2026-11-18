import { useRef, type AnchorHTMLAttributes } from 'react'
import { useGlassShine } from '../hooks/useGlassShine'
import { RollText } from './RollText'
import styles from './Button.module.css'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** `link` = texto sublinhado, sem fundo (ex.: "Ver serviços ↓") */
  variant?: 'primary' | 'ghost' | 'inverse' | 'link'
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  // escreve --mx no elemento; o CSS usa isso pro arco de reflexo nos botões sólidos
  useGlassShine(ref)

  return (
    <a ref={ref} className={`${styles.button} ${styles[variant]} ${className}`} {...rest}>
      <RollText>{children}</RollText>
    </a>
  )
}
