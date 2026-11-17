import { useRef, type RefObject } from 'react'
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useSpiral } from '../hooks/useSpiral'
import styles from './SpiralBackground.module.css'

type Props = {
  /** Área que reage ao mouse (a hero). */
  trackRef?: RefObject<HTMLElement | null>
  /** false quando o fade-out do scroll terminou: o loop para. */
  active?: boolean
}

/** Fundo de linhas em espiral da hero (decorativo). */
export function SpiralBackground({ trackRef, active = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fine = useMediaQuery(FINE_POINTER)
  const reduced = useMediaQuery(REDUCED_MOTION)

  useSpiral(canvasRef, {
    trackRef,
    interactive: fine && !reduced,
    animate: !reduced,
    active,
  })

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
