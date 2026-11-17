# Wa Labs 和

Site da Wa Labs — estúdio de desenvolvimento web e mobile.

**Stack:** React 19 + TypeScript + Vite · CSS Modules · fontes Unbounded (títulos) e Inter (texto).

## Rodando

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera /dist
npm run preview   # serve o build
```

## Estrutura

```
src/
├─ components/      # Header, Hero, Services, Process, Contact, Footer, Logo, Button
├─ data/content.ts  # todos os textos do site
├─ styles/
│  ├─ tokens.css    # cores, fontes, espaçamentos (paleta provisória)
│  └─ global.css    # reset e estilos base
├─ App.tsx
└─ main.tsx
```

## Pendências

- [ ] Definir a paleta final (trocar só em `src/styles/tokens.css`)
- [ ] Substituir o 和 placeholder pelo logo desenhado (`src/components/Logo.tsx` e `public/favicon.svg`)
- [ ] E-mail real em `src/data/content.ts`
- [ ] Portfólio / cases
