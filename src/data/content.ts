// Conteúdo do site num lugar só — edite os textos aqui.

export const nav = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Contato', href: '#contato' },
] as const

/* ---------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------- */

export type TitleWeight = 'light' | 'heavy'

/**
 * Um pedaço de texto do título, com peso próprio.
 * Pedaços `light` reagem ao cursor (peso variável letra a letra).
 * `dot` = índice da letra (contando espaços) que ganha o pontinho de destaque embaixo.
 */
export type TitleText = { text: string; weight: TitleWeight; dot?: number }
/** Marca onde a pílula (和 / mídia de projeto) entra na linha. */
export type TitlePill = { pill: true }
export type TitleSegment = TitleText | TitlePill

export type TitleLine = {
  /** start = esquerda · indent = recuada ~15% · end = direita */
  align: 'start' | 'indent' | 'end'
  segments: TitleSegment[]
}

const heroTitle: TitleLine[] = [
  {
    align: 'start',
    segments: [
      { text: 'Software', weight: 'heavy' },
      { pill: true },
      { text: 'feito', weight: 'light' },
    ],
  },
  {
    align: 'indent',
    segments: [
      { text: 'em harmonia', weight: 'light', dot: 6 },
    ],
  },
  {
    align: 'end',
    segments: [{ text: 'com você.', weight: 'heavy' }],
  },
]

/** Item do reel da pílula. Sem `src` vira placeholder; `.mp4` vira <video>. */
export type ReelItem = { src?: string; alt: string; label?: string }

export const heroReel: ReelItem[] = [
  { alt: 'Wa Labs 和' }, // sem label = o 和 sobre o verde
  { alt: 'Projeto de site', label: 'site' },
  { alt: 'Projeto de app', label: 'app' },
  { alt: 'Projeto de sistema', label: 'sistema' },
]

export const hero = {
  meta: {
    brand: 'Wa Labs®',
    studio: 'Estúdio de desenvolvimento',
    location: 'Maringá — PR, Brasil',
    nowLabel: 'Agora',
    tokyoLabel: 'TYO',
    yearPrefix: '和',
  },
  intro: 'Wa Labs — estúdio de sites, sistemas web e apps mobile em Maringá',
  verticalLabel: '調和 — 開発', // harmonia — desenvolvimento
  /** Frase lida por leitores de tela (o título visual é quebrado em pedaços). */
  titleLabel: 'Software feito em harmonia com você.',
  title: heroTitle,
  pillBadgePrefix: '和',
  disciplines: '(Design · Código · Web · Mobile)',
  subtitle: 'Sites, sistemas e apps sob medida — do primeiro rascunho ao deploy, sem pular etapa.',
  primaryCta: { label: 'Começar um projeto', href: '#contato' },
  secondaryCta: { label: 'Ver serviços', href: '#servicos' },
  scrollLabel: 'Scroll',
}

export const preloader = {
  brand: 'Wa Labs®',
  studio: 'Estúdio de desenvolvimento',
  place: '和 — Maringá, PR',
  footer: 'Wa Labs',
  ariaLabel: 'Carregando',
}

export const manifesto = {
  label: '(01) Manifesto',
  metaPrefix: '和',
  lines: ['Não entregamos só código.', 'Construímos em harmonia.'],
}

export type Service = {
  kanji: string
  title: string
  description: string
  tags: string[]
}

export const services: Service[] = [
  {
    kanji: '網',
    title: 'Sites e landing pages',
    description:
      'Páginas rápidas, responsivas e pensadas pra converter visitantes em clientes.',
    tags: ['React', 'Next.js', 'SEO'],
  },
  {
    kanji: '築',
    title: 'Sistemas web',
    description:
      'Painéis, plataformas e ferramentas internas que resolvem problemas reais do dia a dia.',
    tags: ['TypeScript', 'APIs', 'Dashboards'],
  },
  {
    kanji: '携',
    title: 'Apps mobile',
    description:
      'Aplicativos para Android e iOS com uma única base de código, do protótipo à loja.',
    tags: ['Flutter', 'Android', 'iOS'],
  },
]

export const process = [
  {
    step: '01',
    title: 'Conversa',
    description: 'Entendemos o seu objetivo, o público e o que realmente precisa existir.',
  },
  {
    step: '02',
    title: 'Proposta',
    description: 'Escopo, prazo e valor claros antes de qualquer linha de código.',
  },
  {
    step: '03',
    title: 'Construção',
    description: 'Entregas curtas e frequentes, com você acompanhando cada etapa.',
  },
  {
    step: '04',
    title: 'Lançamento',
    description: 'Publicamos, ajustamos e seguimos por perto depois do go-live.',
  },
]

export const contact = {
  title: 'Vamos construir algo juntos?',
  subtitle: 'Conte sua ideia e respondemos em até 1 dia útil.',
  email: 'contato@walabs.dev', // TODO: trocar pelo e-mail real
  whatsapp: 'https://wa.me/5545999505463',
}
