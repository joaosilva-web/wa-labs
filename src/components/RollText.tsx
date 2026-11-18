import { cloneElement, isValidElement, type ReactNode } from 'react'
import styles from './RollText.module.css'

/** Uma célula de letra: janela de overflow + pilha animável com duas cópias */
function charCell(ch: string, idx: number): React.ReactElement {
  return (
    <span
      key={idx}
      className={styles.char}
      style={{ '--i': idx } as React.CSSProperties}
    >
      <span className={styles.stack}>
        <span>{ch}</span>
        <span>{ch}</span>
      </span>
    </span>
  )
}

/**
 * Converte um ReactNode em spans de palavras (inline-block, white-space: nowrap)
 * separados por espaços de texto (permitindo quebra de linha entre palavras).
 * Elementos são clonados com seus filhos convertidos em células de letra.
 */
function buildSegments(node: ReactNode, counter: { i: number }): ReactNode[] {
  if (node === null || node === undefined || typeof node === 'boolean') return []
  if (typeof node === 'number') return buildSegments(String(node), counter)

  if (typeof node === 'string') {
    const result: ReactNode[] = []
    const regex = /\S+| +/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(node)) !== null) {
      if (/^\s/.test(match[0])) {
        result.push(' ')
      } else {
        const wordStart = counter.i
        const cells = [...match[0]].map((ch) => charCell(ch, counter.i++))
        result.push(
          <span key={`w${wordStart}`} className={styles.word}>
            {cells}
          </span>,
        )
      }
    }
    return result
  }

  if (Array.isArray(node)) {
    return node.flatMap((child) => buildSegments(child, counter))
  }

  if (isValidElement(node)) {
    const nodeChildren = (node.props as { children?: ReactNode }).children
    if (nodeChildren == null) return [node]
    const innerSegs = buildSegments(nodeChildren, counter)
    return [cloneElement(node as React.ReactElement, {}, ...innerSegs)]
  }

  return []
}

/**
 * Texto que "rola" no hover do link/botão pai: cada letra é uma janela independente
 * com duas cópias empilhadas — no hover, a pilha sobe revelando a cópia inferior.
 * Palavras inteiras não quebram no meio; o texto pode fluir em múltiplas linhas.
 * Leitores de tela leem o conteúdo original via span oculto.
 */
export function RollText({ children }: { children: ReactNode }) {
  const counter = { i: 0 }
  const segments = buildSegments(children, counter)
  const total = counter.i

  // Stagger: textos curtos têm efeito bem marcado; textos longos não demoram demais
  const rollStep = total > 0 ? `${Math.min(28, Math.round(320 / total))}ms` : '28ms'

  return (
    <span
      className={styles.roll}
      style={{ '--roll-step': rollStep } as React.CSSProperties}
    >
      <span className={styles.srOnly}>{children}</span>
      <span aria-hidden="true">{segments}</span>
    </span>
  )
}
