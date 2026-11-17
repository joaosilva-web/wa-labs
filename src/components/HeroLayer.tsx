import type { ReelItem } from '../data/content'
import { Slide } from './HeroPill'
import pillStyles from './HeroPill.module.css'
import styles from './HeroLayer.module.css'

type Props = {
  items: ReelItem[]
  active: number
}

/**
 * Camada que nasce exatamente em cima da pílula e expande até a tela cheia.
 * Toda a geometria vem de CSS variables escritas no sticky da hero
 * (--p e o retângulo medido da pílula); nada aqui re-renderiza por frame.
 * Todos os itens ficam montados (mídia pré-carregada) e só o atual aparece.
 */
export function HeroLayer({ items, active }: Props) {
  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.media}>
        {items.map((item, i) => (
          <span key={i} className={pillStyles.slide} data-active={i === active || undefined}>
            <Slide item={item} index={i} />
          </span>
        ))}
      </div>
      <div className={styles.overlay} />
    </div>
  )
}
