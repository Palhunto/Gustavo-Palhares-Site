# Gustavo Palhares — publicação digital

Fundação técnica da publicação digital pessoal de Gustavo Palhares. O projeto está na Fase 1: ambiente mínimo, estático e reproduzível, sem implementação do modelo editorial ou do design final.

## Requisitos

- Node.js 24.16.0;
- npm 11.13.0.

## Uso local

```sh
npm ci
npm run dev
```

O servidor de desenvolvimento informa a URL local. Para verificar toda a fundação, execute:

```sh
npm run validate
```

Também estão disponíveis `npm run check`, `npm run lint`, `npm run format:check`, `npm run build` e `npm run preview`.

## Build

`npm run build` gera o site estático em `dist/`. Essa pasta é o único artefato implantável e não exige runtime Node em produção.

## Documentação canônica

- [Brief do produto](./docs/BRIEF.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Modelo de conteúdo](./docs/CONTENT_MODEL.md)
- [Plano de implementação](./docs/PLAN.md)
- [Decisões arquiteturais](./docs/DECISIONS.md)

## Limites da Fase 1

Esta fase contém apenas o scaffold, as ferramentas de qualidade, a integração contínua e uma página provisória. Não inclui modelo editorial completo, Pagefind, framework cliente, adapter, backend, CMS, deploy, analytics ou direção visual definitiva.
