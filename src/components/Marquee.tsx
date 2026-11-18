import { Fragment, useRef } from 'react'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useMarqueeScroll } from '../hooks/useMarqueeScroll'
import styles from './Marquee.module.css'

type Props = {
  items: readonly string[]
  /** Separador entre os itens (peso leve). */
  separator?: string
  /** Frase lida por leitores de tela no lugar da faixa. */
  label: string
}

/**
 * Faixa infinita: duas cópias idênticas e um translateX de 0 → -50% em loop (emenda sem salto).
 * O scroll acelera e inverte o sentido (useMarqueeScroll). A faixa é decorativa.
 */
export function Marquee({ items, separator = '和', label }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)
  useMarqueeScroll(trackRef, { enabled: !reduced })

  return (
    <>
      <p className={styles.srOnly}>{label}</p>
      <div className={styles.marquee} data-tone="primary" aria-hidden="true">
        <div ref={trackRef} className={styles.track}>
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.group}>
              {items.map((item) => (
                <Fragment key={item}>
                  <span className={styles.item}>{item}</span>
                  <span className={styles.sep}>{separator}</span>
                </Fragment>
              ))}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
