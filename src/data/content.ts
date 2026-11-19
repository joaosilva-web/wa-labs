// Conteúdo do site num lugar só — edite os textos aqui.

/**
 * Numeração única das seções — header, rótulos (00) Manifesto, (01) Serviços…
 * O Manifesto fica fora do nav, por isso é o 00.
 */
export const sections = { manifesto: 0, servicos: 1, processo: 2, sobre: 3, duvidas: 4, contato: 5 } as const
export type SectionId = keyof typeof sections

/** Número da seção com dois dígitos: 1 → "01". */
export const sectionNumber = (id: SectionId) => String(sections[id]).padStart(2, '0')

export const nav = [
  { label: 'Serviços', href: '#servicos', section: 'servicos' },
  { label: 'Processo', href: '#processo', section: 'processo' },
  { label: 'Sobre', href: '#sobre', section: 'sobre' },
  { label: 'Dúvidas', href: '#duvidas', section: 'duvidas' },
  { label: 'Contato', href: '#contato', section: 'contato' },
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
  label: 'Manifesto', // vira "(00) Manifesto" pelo mapa de seções
  metaPrefix: '和',
  lines: ['Não entregamos só código.', 'Construímos em harmonia.'],
  /** Acende palavra por palavra com o scroll */
  paragraph:
    'A Wa Labs nasceu de uma ideia simples: software bom é aquele que se encaixa. ' +
    'Design e código caminham juntos desde o primeiro rascunho — sem template pronto, ' +
    'sem atalho, sem etapa pulada. Cada projeto começa do zero, é construído com calma ' +
    'e entregue com precisão, pra funcionar',
  /** Continuação do parágrafo que acende com fundo verde */
  highlight: 'em harmonia com o seu negócio.',
  signature: '— Wa Labs, 和',
}

export type Service = {
  kanji: string
  /** Leitura do kanji (romaji) e significado — aparecem embaixo dele. */
  reading: string
  meaning: string
  title: string
  description: string
  tags: string[]
  /** Mídia da pílula que segue o cursor. Sem `src`: gradiente da paleta com o kanji. */
  preview?: ReelItem
}

export const servicesSection = {
  label: 'Serviços',
  /** "03 frentes" — o número vem do tamanho da lista */
  countLabel: 'frentes',
  title: ['Três frentes,', 'uma só harmonia.'],
  lead: 'Do site institucional ao app na loja — cada projeto nasce do zero, pensado pro seu negócio.',
  href: '#contato',
  /** Início da frase lida no lugar da faixa (só leitores de tela) */
  marqueeIntro: 'Trabalhamos com',
}

/** Faixa em movimento que fecha a seção de serviços (o 和 é o separador). */
export const marquee = ['Sites', 'Sistemas web', 'Apps mobile', 'React', 'Flutter', 'TypeScript']

export const services: Service[] = [
  {
    kanji: '網',
    reading: 'Ami',
    meaning: 'Rede',
    preview: { alt: 'Prévia de site' },
    title: 'Sites e landing pages',
    description:
      'Páginas rápidas, responsivas e pensadas pra converter visitantes em clientes.',
    tags: ['React', 'Next.js', 'SEO'],
  },
  {
    kanji: '築',
    reading: 'Kizuku',
    meaning: 'Construir',
    preview: { alt: 'Prévia de sistema web' },
    title: 'Sistemas web',
    description:
      'Painéis, plataformas e ferramentas internas que resolvem problemas reais do dia a dia.',
    tags: ['TypeScript', 'APIs', 'Dashboards'],
  },
  {
    kanji: '携',
    // 携 sozinho se lê tazusaeru ("levar consigo"); 携帯 (keitai, dois kanji) é "celular"
    reading: 'Tazusaeru',
    meaning: 'Levar consigo',
    preview: { alt: 'Prévia de app' },
    title: 'Apps mobile',
    description:
      'Aplicativos para Android e iOS com uma única base de código, do protótipo à loja.',
    tags: ['Flutter', 'Android', 'iOS'],
  },
]

export const processSection = {
  label: 'Processo',
  /** "04 etapas" (mobile) — o número vem do tamanho da lista */
  countLabel: 'etapas',
  title: ['Simples,', 'do começo ao fim.'],
  /** Convite pra rolar, embaixo do título (desktop, trilho horizontal) */
  scrollHint: 'Role',
  /** Contador "02 / 04" lido por leitores de tela */
  counterSr: (step: number, total: number) => `Etapa ${step} de ${total}`,
}

export const process = [
  {
    step: '01',
    kanji: '話',
    reading: 'Hanasu',
    meaning: 'Conversar',
    title: 'Conversa',
    description: 'Entendemos o seu objetivo, o público e o que realmente precisa existir.',
    deliverables: ['Objetivos e público', 'Referências', 'Escopo inicial'],
  },
  {
    step: '02',
    kanji: '案',
    reading: 'An',
    meaning: 'Plano',
    title: 'Proposta',
    description: 'Escopo, prazo e valor claros antes de qualquer linha de código.',
    deliverables: ['Escopo detalhado', 'Prazo', 'Orçamento fechado'],
  },
  {
    step: '03',
    kanji: '作',
    reading: 'Tsukuru',
    meaning: 'Fazer',
    title: 'Construção',
    description: 'Entregas curtas e frequentes, com você acompanhando cada etapa.',
    deliverables: ['Entregas curtas', 'Ambiente de testes', 'Ajustes com você'],
  },
  {
    step: '04',
    kanji: '発',
    reading: 'Hatsu',
    meaning: 'Lançar',
    title: 'Lançamento',
    description: 'Publicamos, ajustamos e seguimos por perto depois do go-live.',
    deliverables: ['Publicação', 'Domínio e SEO básico', 'Suporte pós-lançamento'],
  },
]

/* ---------------------------------------------------------------
 * Sobre
 * ------------------------------------------------------------- */

export const about = {
  label: 'Sobre',
  aside: 'Maringá, PR',
  title: [
    { text: 'Feito por quem', weight: 'light' as const },
    { text: 'entende o problema.', weight: 'heavy' as const },
  ],
  paragraphs: [
    'Sou desenvolvedor há +5 anos, entre sites, sistemas web e apps. ' +
    'Criei a Wa Labs pra trabalhar do jeito que eu acredito: conversa direta, sem intermediário, ' +
    'e cada projeto pensado do zero para trazer hamonia para seu projeto e sua vida.',
    'Quando você fala com a Wa Labs, fala comigo — quem desenha, planeja, escreve o código e coloca no ar.',
  ],
  facts: [
    { label: 'Experiência', value: '+5 anos' },
    { label: 'Resposta', value: 'em até 1 dia útil' },
    { label: 'Atendimento', value: 'direto comigo' },
  ],
  photo: {
    src: '/images/joao-gustavo.jpg',
    alt: 'João Gustavo — Wa Labs',
    width: 1200,
    height: 1500,
  },
  why: {
    kanji: '和',
    kanjiReading: 'WA · HARMONIA',
    title: 'Por que Wa?',
    text:
      '和 (wa) é um conceito japonês que vai além de "harmonia" — é a ideia de que as partes ' +
      'trabalham juntas sem perder a identidade de cada uma. É assim que enxergo a relação ' +
      'entre design e código, entre produto e negócio, entre estúdio e cliente.',
  },
}

/* ---------------------------------------------------------------
 * Dúvidas (FAQ)
 * ------------------------------------------------------------- */

export type FaqItem = { q: string; a: string }

export const faq = {
  label: 'Dúvidas',
  aside: 'Perguntas frequentes',
  title: [
    { text: 'Antes de', weight: 'light' as const },
    { text: 'começar.', weight: 'heavy' as const },
  ] satisfies TitleText[],
  footer: { text: 'Ficou alguma dúvida?', cta: 'Fale comigo ↓', href: '#contato' },
  items: [
    {
      q: 'Quanto tempo leva um projeto?',
      a:
        // TODO: revisar prazos reais
        'Depende do escopo. Um site institucional bem definido fica pronto em 3–4 semanas. ' +
        'Um sistema web com autenticação e painel admin leva de 6 a 12 semanas. ' +
        'Na proposta você recebe um cronograma detalhado antes de assinar qualquer contrato.',
    },
    {
      q: 'Vocês atendem só Maringá ou trabalham à distância?',
      a:
        'Atendo todo o Brasil — e também clientes no exterior. ' +
        'Toda a comunicação é remota por padrão: videochamada, e-mail e WhatsApp. ' +
        'Presencial em Maringá é possível quando faz sentido.',
    },
    {
      q: 'Qual é o processo de pagamento?',
      a:
        // TODO: confirmar modelo de pagamento
        'O modelo padrão é: 50% na aprovação da proposta, 50% na entrega final. ' +
        'Para projetos maiores podemos dividir em marcos mensais. ' +
        'Aceito PIX, transferência bancária e boleto.',
    },
    {
      q: 'Posso pedir alterações depois da entrega?',
      a:
        'Sim. Todo projeto inclui um período de ajustes de 30 dias após o go-live sem custo adicional. ' +
        'Depois disso ofereço planos de suporte mensal ou orçamentos pontuais conforme a necessidade.',
    },
    {
      q: 'Preciso fornecer o design ou vocês criam tudo?',
      a:
        'Pode ser os dois. Se você já tem um design aprovado eu implemento com fidelidade total. ' +
        'Se ainda não tem, o processo começa pela etapa de design — wireframes, identidade visual e protótipo — ' +
        'tudo entregue antes de uma linha de código.',
    },
    {
      q: 'O site vai ficar bem no celular?',
      a:
        'Sim, sempre. Responsividade não é opcional — cada projeto é desenvolvido mobile-first ' +
        'e testado em dispositivos reais, não só em emuladores.',
    },
    {
      q: 'Posso editar o site sozinho depois de pronto?',
      a:
        // TODO: definir CMS preferido (Sanity, Contentful, Tina, etc.)
        'Quando o projeto inclui conteúdo dinâmico integramos um CMS visual ' +
        'para que você edite textos, imagens e páginas sem tocar em código. ' +
        'Se o site for estático a edição é feita via repositório Git — com documentação clara.',
    },
    {
      q: 'O que acontece se eu não gostar do resultado?',
      a:
        'O processo foi desenhado exatamente pra evitar isso. ' +
        'Você acompanha cada entrega, aprova wireframes antes do código e recebe demos funcionais em cada marco. ' +
        'Surpresa negativa no final é sinal de processo ruim — e aqui o processo é a prioridade.',
    },
  ] satisfies FaqItem[],
}

const _whatsapp = 'https://wa.me/5545999505463'
const _email = 'contato@walabs.dev' // TODO: trocar pelo e-mail real

export const contact = {
  label: 'Contato',
  aside: 'Resposta em até 1 dia útil',
  title: [
    { text: 'Vamos construir', weight: 'light' as const },
    { text: 'algo juntos?', weight: 'heavy' as const },
  ],
  lead: 'Conte o que você precisa. A gente responde com perguntas certas, não com proposta genérica.',
  channels: [
    { label: 'WhatsApp', value: '(45) 99950-5463', href: _whatsapp },
    { label: 'E-mail', value: _email, href: `mailto:${_email}`, copy: true as const },
    { label: 'GitHub', value: '@joaosilva-web', href: 'https://github.com/joaosilva-web' },
    // Instagram / LinkedIn: deixar comentado como exemplo; canal sem href não renderiza
    // { label: 'Instagram', value: '@walabs' },
  ],
  projectTypes: ['Site', 'Sistema web', 'App mobile', 'Outro'],
  budgets: ['Até R$ 2 mil', 'R$ 2–5 mil', 'R$ 5–10 mil', 'Acima de R$ 10 mil', 'Ainda não sei'], // TODO: revisar faixas
  email: _email,
  whatsapp: _whatsapp,
}
