# Gustavo Palhares — publicação digital

Fundação técnica e modelo editorial executável da publicação digital pessoal de Gustavo Palhares. O projeto está na Fase 2: sete Content Collections locais, contratos tipados e gates de integridade, ainda sem páginas públicas finais ou sistema visual.

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

Também estão disponíveis:

- `npm run check`: Astro e TypeScript;
- `npm run lint`: ESLint;
- `npm run format:check`: Prettier;
- `npm run test:content`: testes isolados do modelo editorial;
- `npm run content:validate`: schemas, MDX, referências, elegibilidade, direitos e integridade;
- `npm run build`: gate de conteúdo seguido do build estático;
- `npm run preview`: inspeção local de `dist/`.

## Build

`npm run build` valida o conteúdo antes de gerar o site estático em `dist/`. Essa pasta é o único artefato implantável e não exige runtime Node em produção.

## Modelo editorial

As sete collections estão em `src/content/`: `trabalhos`, `caderno`, `colecoes`, `edicoes`, `midia`, `pessoas` e `paginas`. Os schemas reutilizáveis e o gate ficam em `src/lib/content/`. Fixtures inválidas são isoladas em `tests/fixtures/content/` e nunca são carregadas pelo Astro.

O gate captura um único instante por execução. Para testar localmente a imutabilidade contra uma referência Git explícita, informe `CONTENT_BASE_REF`:

```sh
CONTENT_BASE_REF=main npm run content:validate
```

No PowerShell:

```powershell
$env:CONTENT_BASE_REF = "main"
npm.cmd run content:validate
```

Em pull requests, a workflow informa automaticamente o SHA da base. Quando não há histórico ou a base não contém conteúdo editorial, a comparação histórica é corretamente ignorada; schemas e integridade corrente continuam obrigatórios.

## Documentação canônica

- [Brief do produto](./docs/BRIEF.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Modelo de conteúdo](./docs/CONTENT_MODEL.md)
- [Plano de implementação](./docs/PLAN.md)
- [Decisões arquiteturais](./docs/DECISIONS.md)

## Limites da Fase 2

Esta fase não cria rotas editoriais, componentes visuais finais, homepage, Arquivo ou busca. Também não inclui Pagefind, framework cliente, adapter, backend, CMS, deploy, analytics ou direção visual definitiva. A página provisória da Fase 1 permanece como a única rota.
