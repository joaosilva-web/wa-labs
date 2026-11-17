import type { ReelItem } from '../data/content'
import styles from './HeroPill.module.css'

type Props = {
  items: ReelItem[]
  /** Item visível agora (controlado pelo pai com useReel). */
  active: number
  badgePrefix?: string
  className?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const isVideo = (src: string) => /\.mp4($|\?)/i.test(src)

export function Slide({ item, index }: { item: ReelItem; index: number }) {
  if (item.src) {
    return isVideo(item.src) ? (
      <video src={item.src} muted autoPlay loop playsInline />
    ) : (
      <img src={item.src} alt="" decoding="async" />
    )
  }

  if (!item.label) {
    // TODO: placeholder — trocar pelo logo 和 desenhado à mão (SVG) quando estiver pronto.
    return <span className={styles.kanji}>和</span>
  }

  // Placeholder de projeto: gradiente da paleta + rótulo mono
  return (
    <span className={`${styles.placeholder} ${styles[`tone${index % 3}`]}`}>
      <span className={styles.label}>{item.label}</span>
    </span>
  )
}

/**
 * Pílula inline do título — elipse da altura da linha que funciona como reel (corte seco).
 * Todos os slides ficam montados e só o ativo aparece: assim as mídias já vêm pré-carregadas
 * e a troca é instantânea. Decorativa: o <h1> já tem aria-label com a frase completa.
 */
export function HeroPill({ items, active, badgePrefix = '和', className = '' }: Props) {
  return (
    <span className={`${styles.pill} ${className}`} aria-hidden="true">
      <span className={styles.body} data-pill-body="">
        {items.map((item, i) => (
          <span key={i} className={styles.slide} data-active={i === active || undefined}>
            <Slide item={item} index={i} />
          </span>
        ))}
      </span>
      <span className={styles.badge}>
        {badgePrefix} · {pad(active + 1)}/{pad(items.length)}
      </span>
    </span>
  )
}
