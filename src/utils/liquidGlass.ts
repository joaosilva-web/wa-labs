/**
 * Mapa de deslocamento do "Liquid Glass" pra uma pílula (stadium) w × h.
 *
 * Usado por um <feDisplacementMap> como `in2`: o filtro lê, pra cada pixel,
 *   saída(x, y) = fundo(x + scale · (R − 0.5), y + scale · (G − 0.5))
 * - R codifica o deslocamento em X, G em Y (128 = zero)
 * - miolo plano: R = G = 128, o fundo passa sem distorção
 * - faixa de `bevel` px junto à borda: o pixel busca o fundo mais pra dentro
 *   (na direção do centro), cada vez mais forte perto da borda, numa curva
 *   convexa (1 − √(1 − x²)) — é o "bisel" de uma lente
 *
 * Retorna uma data URL (PNG) pra passar ao <feImage>. Gere uma vez por tamanho.
 */
export function buildGlassMap(w: number, h: number, bevel: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const img = ctx.createImageData(w, h)
  const data = img.data
  const r = Math.min(w, h) / 2
  // segmento central do stadium (no formato horizontal, de (r, cy) a (w − r, cy))
  const horizontal = w >= h
  const ax = horizontal ? r : w / 2
  const ay = horizontal ? h / 2 : r
  const bx = horizontal ? w - r : w / 2
  const by = horizontal ? h / 2 : h - r

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // centro do pixel
      const px = x + 0.5
      const py = y + 0.5
      // ponto mais próximo no segmento central
      const cx = Math.min(Math.max(px, Math.min(ax, bx)), Math.max(ax, bx))
      const cy = Math.min(Math.max(py, Math.min(ay, by)), Math.max(ay, by))
      const dx = cx - px
      const dy = cy - py
      const d = Math.hypot(dx, dy)
      const edge = r - d // distância até a borda (≤ 0 = fora da pílula)

      let ox = 0
      let oy = 0
      if (d > 0 && edge < bevel) {
        const t = Math.min(1, 1 - Math.max(edge, 0) / bevel) // 0 no começo do bisel → 1 na borda
        const k = 1 - Math.sqrt(1 - t * t)
        ox = (dx / d) * k // normal pra dentro
        oy = (dy / d) * k
      }

      const i = (y * w + x) * 4
      data[i] = Math.round(128 + ox * 127)
      data[i + 1] = Math.round(128 + oy * 127)
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Máscara do blur graduado pra mesma pílula (stadium) w × h: branco com alfa
 * 0 no miolo → 1 na borda. Usada num <feComposite operator="in"> pra que o blur
 * forte só apareça perto da borda.
 * - `sharp` (0 → 1): fração do raio, a partir do eixo central, que fica 100% nítida
 * - do `sharp` até a borda, o alfa sobe num smoothstep (sem degrau visível)
 *
 * Retorna uma data URL (PNG) pra passar ao <feImage>. Gere uma vez por tamanho.
 */
export function buildEdgeMask(w: number, h: number, sharp: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const img = ctx.createImageData(w, h)
  const data = img.data
  const r = Math.min(w, h) / 2
  const horizontal = w >= h
  const ax = horizontal ? r : w / 2
  const ay = horizontal ? h / 2 : r
  const bx = horizontal ? w - r : w / 2
  const by = horizontal ? h / 2 : h - r
  const ramp = Math.max(1 - sharp, 0.001)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const cx = Math.min(Math.max(px, Math.min(ax, bx)), Math.max(ax, bx))
      const cy = Math.min(Math.max(py, Math.min(ay, by)), Math.max(ay, by))
      // 0 no eixo central da pílula → 1 na borda
      const d = Math.hypot(cx - px, cy - py) / r
      const t = Math.min(1, Math.max(0, (d - sharp) / ramp))
      const a = t * t * (3 - 2 * t)

      const i = (y * w + x) * 4
      data[i] = data[i + 1] = data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

type UAData = { brands?: { brand: string }[] }

/**
 * Refração via `backdrop-filter: url(#…)` só renderiza de verdade no Chromium.
 * Não dá pra usar CSS.supports: o Safari diz que suporta e não desenha nada.
 */
export function supportsRefraction(): boolean {
  const ua = (navigator as Navigator & { userAgentData?: UAData }).userAgentData
  return !!ua?.brands?.some(({ brand }) => /^(Chromium|Google Chrome|Microsoft Edge)$/.test(brand))
}
