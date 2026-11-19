/**
 * Direção de entrada dos elementos por seção.
 *
 * Índices: 0=Manifesto 1=Serviços 2=Processo 3=Sobre 4=Dúvidas 5=Contato 6=Footer
 * Pares   → normal   (title=left, text=right)
 * Ímpares → espelhado (title=right, text=left)
 */
export function revealSide(sectionIdx: number, role: 'title' | 'text'): 'left' | 'right' {
  const mirrored = sectionIdx % 2 === 1
  if (role === 'title') return mirrored ? 'right' : 'left'
  return mirrored ? 'left' : 'right'
}
