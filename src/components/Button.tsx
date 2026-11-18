import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useGlassShine } from '../hooks/useGlassShine'
import { RollText } from './RollText'
import styles from './Button.module.css'

type SharedProps = {
  variant?: 'primary' | 'ghost' | 'inverse' | 'link'
  className?: string
  children?: ReactNode
}

type Props =
  | (SharedProps & { as: 'button' } & ButtonHTMLAttributes<HTMLButtonElement>)
  | (SharedProps & { as?: 'a' } & AnchorHTMLAttributes<HTMLAnchorElement>)

export function Button(props: Props) {
  const { variant = 'primary', className = '', children, as: tag = 'a', ...rest } = props
  const ref = useRef<HTMLElement>(null)
  useGlassShine(ref)

  const cls = `${styles.button} ${styles[variant]} ${className}`

  if (tag === 'button') {
    return (
      <button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={cls}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <RollText>{children}</RollText>
      </button>
    )
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <a ref={ref as any} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
      <RollText>{children}</RollText>
    </a>
  )
}
