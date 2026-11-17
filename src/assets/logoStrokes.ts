/*
 * Traços do logo 和 usados no preloader.
 *
 * PLACEHOLDER: estes paths são uma versão simples e geométrica. O logo final vai ser
 * desenhado à mão. Ao exportar o SVG final:
 *   - UM <path> POR TRAÇO, na ORDEM DE ESCRITA (é a ordem em que eles se desenham);
 *   - traços como linhas (stroke), não contornos preenchidos, pra o stroke-dashoffset funcionar;
 *   - mantenha o viewBox com a proporção da pílula da hero (2.2 : 1), ou ajuste LOGO_VIEWBOX.
 * Depois é só trocar as strings abaixo — o Preloader não precisa mudar.
 */

/** Proporção 2.2 : 1, igual à pílula da hero (o logo encolhe e encaixa nela na saída). */
export const LOGO_VIEWBOX = { width: 213, height: 100 }

/** Pílula em volta: começa no topo esquerdo e corre no sentido horário. */
export const LOGO_PILL = 'M 50 3 H 163 A 47 47 0 0 1 163 97 H 50 A 47 47 0 0 1 50 3 Z'

/** Posição do 和 (desenhado numa caixa 100×100) dentro da pílula. */
export const KANJI_TRANSFORM = 'translate(71.5 15) scale(0.7)'

/** Os 8 traços do 和, na ordem de escrita (caixa 100×100). */
export const KANJI_STROKES: string[] = [
  // 禾
  'M 42 9 Q 30 15 12 18', // 1. ノ curto no topo
  'M 8 35 L 48 35', // 2. 一 horizontal
  'M 28 19 L 28 94', // 3. 丨 vertical
  'M 27 41 Q 20 62 5 77', // 4. ノ para a esquerda
  'M 30 47 Q 38 55 47 62', // 5. 丶 para a direita
  // 口
  'M 58 38 L 59 84', // 6. 丨 esquerdo
  'M 58 38 L 93 38 L 91 84', // 7. 𠃍 topo + lado direito
  'M 60 81 L 91 81', // 8. 一 base
]
