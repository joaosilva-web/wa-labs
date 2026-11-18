import { cloneElement, isValidElement, type ReactNode } from 'react'
import styles from './RollText.module.css'

/**
 * Percorre `node` recursivamente quebrando strings em spans `.char` com `--i`.
 * Elementos são clonados com os filhos já quebrados, mantendo classes e estilos.
 * O contador é compartilhado por toda a árvore para que o índice seja contínuo.
 */
function splitLetters(node: ReactNode, counter: { i: number }): ReactNode {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return node
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).split('').map((ch) => {
      const idx = counter.i++
      return (
        <span
          key={idx}
          className={styles.char}
          style={{ '--i': idx } as React.CSSProperties}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => {
      const result = splitLetters(child, counter)
      return Array.isArray(result) ? result : [result]
    })
  }

  if (isValidElement(node)) {
    const nodeChildren = (node.props as { children?: ReactNode }).children
    if (nodeChildren == null) return node
    const kids = splitLetters(nodeChildren, counter)
    return cloneElement(node as React.ReactElement, {}, kids)
  }

  return node
}

/**
 * Texto que "rola" no hover do link/botão pai: duas cópias empilhadas,
 * cada letra rolando individualmente da esquerda pra direita (efeito caça-níquel).
 * Leitores de tela leem o conteúdo original via span oculto.
 */
export function RollText({ children }: { children: ReactNode }) {
  const c1 = { i: 0 }
  const copy1 = splitLetters(children, c1)
  const total = c1.i

  const c2 = { i: 0 }
  const copy2 = splitLetters(children, c2)

  // Stagger: textos curtos têm efeito bem marcado; textos longos não demoram demais
  const rollStep = total > 0 ? `${Math.min(28, Math.round(320 / total))}ms` : '28ms'

  return (
    <span
      className={styles.roll}
      style={{ '--roll-step': rollStep } as React.CSSProperties}
    >
      {/* Lido pelos leitores de tela; as cópias com letras são aria-hidden */}
      <span className={styles.srOnly}>{children}</span>
      <span className={styles.item} aria-hidden="true">
        {copy1}
      </span>
      <span className={styles.item} aria-hidden="true">
        {copy2}
      </span>
    </span>
  )
}
