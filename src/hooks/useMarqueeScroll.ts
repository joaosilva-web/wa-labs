import { useEffect, type RefObject } from 'react'

type Options = {
  enabled: boolean
  /** Quanto a velocidade do scroll (px/ms) multiplica a faixa. */
  gain?: number
  /** Multiplicador máximo. */
  max?: number
}

/**
 * O scroll acelera a faixa e inverte o sentido conforme a direção da rolagem.
 * O loop em si é uma animação CSS; aqui só mexemos no playbackRate dela
 * (negativo = sentido contrário). Mudar o playbackRate mantém a posição atual,
 * então não há salto — trocar animation-duration por CSS variable faria a faixa pular.
 * O rAF só roda com a faixa visível e enquanto a velocidade não voltou à base.
 */
export function useMarqueeScroll(
  trackRef: RefObject<HTMLElement | null>,
  { enabled, gain = 2.5, max = 6 }: Options,
) {
  useEffect(() => {
    const track = trackRef.current
    if (!enabled || !track) return

    let lastY = window.scrollY
    let lastT = performance.now()
    let velocity = 0 // px/ms, com sinal (positivo = rolando pra baixo)
    let rate = 1
    let raf = 0
    let inView = false

    const animation = () => track.getAnimations()[0]

    const tick = () => {
      velocity *= 0.9 // sem eventos de scroll, a velocidade morre e a faixa volta à base
      const speed = Math.abs(velocity)
      const target = speed < 0.02 ? 1 : Math.sign(velocity) * (1 + Math.min(speed * gain, max))
      rate += (target - rate) * 0.08

      const settled = target === 1 && Math.abs(rate - 1) < 0.002
      if (settled) rate = 1
      const anim = animation()
      if (anim) anim.playbackRate = rate
      raf = settled ? 0 : requestAnimationFrame(tick)
    }

    const onScroll = () => {
      const now = performance.now()
      const dt = Math.max(8, now - lastT)
      const v = (window.scrollY - lastY) / dt
      lastY = window.scrollY
      lastT = now
      if (!inView) return
      velocity = v
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Fora da tela o scroll não acelera a faixa; um loop já em andamento termina
    // de voltar à base sozinho (senão ela ficaria presa na velocidade alta)
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (!inView) velocity = 0
    })
    io.observe(track)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      const anim = animation()
      if (anim) anim.playbackRate = 1
    }
  }, [trackRef, enabled, gain, max])
}
