import type { HTMLAttributes } from 'react'
import styles from './GlassCard.module.css'

type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'>

/**
 * Rim de luz + reflexo líquido sobre uma superfície de vidro.
 * Deve ser posicionado como camada absoluta (inset: 0) sobre o container de vidro.
 *
 * Lê CSS vars do ancestral (escritas por useCardTilt):
 *   --rx, --ry   graus de inclinação
 *   --tilt       intensidade do hover (0 → 1)
 *   --gx, --gy   posição do arco de luz (0 → 1)
 *   --gsx        esticão do arco na direção do movimento
 *   --gangle     direção do movimento
 *
 * Cores do rim: definidas no pai via --gc-tint / --gc-rim-outline /
 * --gc-rim-top / --gc-rim-base (padrão: transparentes — LiquidGlass já cuida
 * da borda nas seções onde é usado junto).
 */
export function GlassCard({ className = '', ...rest }: Props) {
  return (
    <div className={`${styles.root} ${className}`} {...rest}>
      <div className={styles.rim} aria-hidden="true" />
      <div className={styles.glare} aria-hidden="true" />
    </div>
  )
}
