# Arquitetura do sistema

Status: congelado para a fundação do projeto  
Escopo: arquitetura técnica e limites entre subsistemas  
Contratos editoriais: [CONTENT_MODEL.md](./CONTENT_MODEL.md)

## 1. Visão geral

O site será uma aplicação multipágina pré-renderizada. Astro transforma conteúdo local validado em documentos HTML independentes. A partir da Fase 7, Pagefind indexa apenas a saída pública depois do build. O artefato implantável é a pasta `dist/`; não existe runtime de aplicação em produção.

### Pipeline inicial — Fases 1 a 6

1. conteúdo e ativos locais passam pelas validações disponíveis na fase alcançada;
2. Astro executa o build estático e produz o `dist/` correspondente às funcionalidades já integradas;
3. verificações automatizadas aplicáveis exercitam essa saída;
4. o `dist/` aprovado constitui o artefato da fase.

Pagefind não integra a Fase 1 nem é gate entre as Fases 1 e 6.

### Pipeline final — a partir da Fase 7

1. conteúdo e ativos passam pela validação completa de schemas, integridade, publicação, direitos, MDX e composição;
2. Astro gera rotas, imagens responsivas, metadados, sitemap e RSS em `dist/`;
3. Pagefind indexa o HTML público de `dist/` e grava ali seu bundle estático;
4. verificações automatizadas exercitam o artefato final, inclusive o índice;
5. o `dist/` aprovado constitui o único artefato implantável.

Pagefind é obrigatório a partir da Fase 7. Depois de integrado, sua ausência, falha ou índice desatualizado bloqueia a publicação.

## 2. Stack congelada

| Área | Decisão |
| --- | --- |
| Framework | Astro 7.x, fixado pelo lockfile na versão estável validada no início da Fase 1. |
| Ambiente de build | Node.js 24 LTS. |
| Pacotes | npm com `package-lock.json`; instalações reproduzíveis com `npm ci`. |
| Linguagem | TypeScript em modo `strict`. |
| Renderização | Estática por padrão; sem adapter e sem runtime de servidor. |
| Componentes | Componentes `.astro`; nenhum framework cliente inicialmente. |
| Estilos | CSS nativo. |
| Conteúdo | Content Collections de build com loaders locais e schemas Zod. |
| Escrita | Markdown para fluxo linear, MDX controlado para composição e YAML para dados curatoriais. |
| Imagens | `astro:assets` e derivados locais aprovados para web. |
| Busca | Pagefind executado depois do build Astro, obrigatório a partir da Fase 7. |
| Navegação | MPA e View Transitions nativas entre documentos como aprimoramento. |
| Testes | `astro check`, ESLint, Prettier, Playwright, Axe, regressão visual e QA manual. |

Referências oficiais de base: [Astro 7](https://astro.build/blog/astro-7/), [Astro Content Collections](https://docs.astro.build/en/reference/modules/astro-content/), [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/), [Node.js releases](https://nodejs.org/en/about/previous-releases) e [Pagefind](https://pagefind.app/docs/).

## 3. Subsistemas e responsabilidades

### 3.1 Conteúdo

As collections `trabalhos`, `caderno`, `colecoes`, `edicoes`, `midia`, `pessoas` e `paginas` são declaradas em uma única configuração de conteúdo. Schemas validam a forma local; regras que atravessam entradas são verificadas pela camada de integridade.

O domínio não será representado por um objeto global semelhante a `site.ts`. Dados globais pequenos, como identidade do site e canais de contato, podem ter configuração própria, mas não armazenarão publicações, galerias ou composições da homepage.

### 3.2 Camada de integridade

A validação além do schema executa antes da geração de páginas e falha de forma legível. Ela deve conferir:

- unicidade e formato de IDs, slugs, números de arquivo e chaves de tradução;
- existência de toda referência entre collections;
- associações válidas entre coleções e seus destaques;
- exatamente uma edição atual;
- publicabilidade de toda entrada selecionada por uma edição pública;
- direitos `cleared` para toda mídia usada por conteúdo público;
- datas coerentes com o estado editorial;
- ausência de rotas colidentes;
- conformidade do MDX com o vocabulário permitido.

Não se deve depender apenas de `reference()` para prometer falha antecipada de todas as relações. A verificação transversal é um gate explícito do projeto.

### 3.3 Renderização editorial

Layouts fornecem documento, landmarks, cabeçalho, rodapé, metadados e hierarquia. Componentes editoriais renderizam apenas contratos validados e não conhecem o sistema de arquivos bruto.

O vocabulário inicial de MDX é fechado:

- `LeadImage`;
- `FullBleed`;
- `Diptych`;
- `Triptych`;
- `ContactSheet`;
- `FilmStrip`;
- `TextColumn`;
- `PullQuote`;
- `MetadataBlock`;
- `Credits`;
- `RelatedWorks`.

Os componentes são injetados pelo renderizador; arquivos MDX não importam módulos. A validação sintática rejeita imports, exports, expressões arbitrárias e nomes fora do registro. Alterar o vocabulário requer atualizar contrato, documentação, testes e a decisão correspondente.

### 3.4 Rotas

As rotas públicas são as definidas em [BRIEF.md](./BRIEF.md). Geradores de rotas usam apenas entradas elegíveis segundo a política de publicação de [CONTENT_MODEL.md](./CONTENT_MODEL.md).

O filtro precisa ocorrer antes de `getStaticPaths` ou mecanismo equivalente. Não basta esconder links: `draft`, `review` e agendamentos futuros não podem produzir HTML em `dist/`.

### 3.5 Arquivo

O Arquivo possui três apresentações sobre o mesmo conjunto público:

- visual: privilegia imagem e relações;
- cronológica: agrupa por data editorial;
- editorial: organiza por formato, contexto, coleção e tema.

Facetas isoladas possuem índices pré-renderizados em `/arquivo/[faceta]/[valor]`, o que permite navegar por links sem JavaScript. Combinações de filtros são um aprimoramento no cliente, representado por query string para compartilhamento e histórico. A página inicial do Arquivo sempre oferece links para as facetas pré-renderizadas; a interface combinatória não pode ser a única forma de chegar a um grupo.

Entradas `archived` ficam fora do conjunto padrão e entram apenas quando o estado arquivado é solicitado explicitamente.

Pessoas não são uma faceta pública do Arquivo no primeiro ciclo. Sua descoberta ocorre nos contextos editoriais e na busca descritos nas seções seguintes.

### 3.6 Busca

Pagefind é executado sobre `dist/` depois do build, a partir da Fase 7. O layout identifica a região indexável e expõe metadados para:

- tipo de conteúdo;
- estado;
- ano e cidade;
- formato e contexto de trabalhos;
- tipo de texto;
- temas e coleções;
- pessoas creditadas quando seus nomes estiverem autorizados para apresentação pública.

O índice inclui `published`, `scheduled` vencidos no instante do build e `archived`. Resultados arquivados recebem identificação visível. Rascunhos, revisões e agendamentos futuros não existem no HTML de entrada e, portanto, não entram no índice. A página de busca fornece uma alternativa navegável para quando JavaScript estiver indisponível, apontando para índices e Arquivo; a busca textual interativa é um aprimoramento. A indexação de créditos permite descobrir pessoas sem criar rota própria ou faceta pública.

### 3.7 Mídia

O catálogo `midia` é a fonte de verdade para identidade, referência ao arquivo, descrição factual, crédito, procedência, ponto focal e direitos. Trabalhos, textos e edições usam referências tipadas. Para derivados locais sob `src/`, o campo `src` segue o contrato de imagem validada do Astro; largura, altura e formato são metadados inferidos do ativo, não campos informados pelo autor.

Política de arquivos:

- RAW, TIFF, PSD e mestres permanecem no sistema fotográfico externo;
- o repositório guarda apenas derivados web aprovados;
- nomes de arquivo não substituem o ID editorial;
- variantes responsivas são geradas no build conforme o contexto de uso;
- AVIF e WebP são formatos preferenciais, com fallback amplamente compatível;
- `srcset` e `sizes` refletem o layout real; não existe um conjunto universal;
- qualidade e corte podem variar por uso, sem modificar direitos ou crédito.

A autoria de texto alternativo é contextual. O catálogo guarda descrição factual e valor padrão, mas cada uso pode declarar `altOverride`, `captionOverride` e `crop`. Imagens decorativas exigem declaração explícita em vez de alt ausente.

Derivados permanecem no Git enquanto o total for inferior a 1 GB e o build de CI permanecer abaixo de 10 minutos. Ultrapassar qualquer limiar abre revisão obrigatória entre Git LFS e serviço de mídia remoto. A troca não pode alterar IDs editoriais nem contratos de uso.

### 3.8 SEO e distribuição

Uma camada única produz:

- título e descrição por página;
- canonical absoluto;
- Open Graph e Twitter Cards;
- metadados de autoria e imagem social;
- dados estruturados adequados ao tipo de página;
- sitemap apenas com rotas públicas;
- RSS derivado da elegibilidade central, incluindo trabalhos e textos `published` e `scheduled` vencidos no instante do build;
- `robots.txt`.

O RSS exclui `draft`, `review`, `scheduled` futuro e `archived`. Entradas `archived` conservam canonical e podem permanecer no sitemap e na busca, mas não voltam ao RSS. Páginas de filtros combinatórios não devem criar canonicals ou URLs indexáveis infinitas.

### 3.9 Navegação e movimento

Links normais e documentos completos são a base. View Transitions nativas entre documentos podem conectar imagens, títulos e elementos persistentes sem converter o produto em SPA.

Regras obrigatórias:

- o botão voltar e o histórico continuam nativos;
- não há interceptação estrutural de rolagem;
- nenhuma transição bloqueia interação ou leitura;
- `prefers-reduced-motion` elimina movimento não essencial;
- foco e anúncio de nova página são testados;
- navegadores sem suporte recebem navegação completa convencional.

`ClientRouter` está fora da fundação. Sua inclusão futura exige necessidade que a API nativa não resolva, análise do ciclo de vida dos scripts, testes de foco/histórico e nova entrada em [DECISIONS.md](./DECISIONS.md).

### 3.10 CSS e sistema visual

O CSS será organizado por responsabilidade: reset, tokens, tipografia, grid, regras editoriais, movimento, utilitários e impressão. O sistema usa custom properties, cascade layers, Grid, subgrid quando suportado, container queries, escalas fluidas, logical properties e estilos de impressão.

Bibliotecas utilitárias ou kits genéricos não fazem parte da fundação. A seleção tipográfica definitiva fica para a fase visual, condicionada a licença web, caracteres do português, itálicos reais, legibilidade, desempenho e renderização em Windows.

### 3.11 Acessibilidade

A arquitetura pressupõe:

- HTML semântico e landmarks consistentes;
- ordem de leitura independente da composição visual;
- navegação completa por teclado;
- foco visível e previsível;
- zoom de 200% sem perda de conteúdo;
- textos alternativos contextuais e legendas separadas;
- diálogos e lightbox com foco gerenciado;
- contraste verificado inclusive sobre fotografia;
- respeito a preferências de movimento;
- funcionamento essencial sem JavaScript.

Testes Axe detectam apenas parte dos problemas e são complementados por leitor de tela, teclado, zoom, mobile real e avaliação editorial de imagens.

## 4. Estrutura conceitual

A futura árvore deverá separar:

- `public`: fontes licenciadas, ícones, imagens sociais fixas e `robots.txt`;
- `src/assets/media`: derivados web processados pelo Astro;
- `src/components`: componentes editoriais, de mídia, navegação, arquivo, busca e homepage;
- `src/content`: entradas das sete collections;
- `src/layouts`: documentos-base por família de página;
- `src/pages`: rotas;
- `src/styles`: sistema visual nativo;
- `src/lib`: consultas, integridade, publicação, SEO, arquivo, busca e mídia;
- `tests`: E2E, acessibilidade e regressão visual;
- `docs`: documentação canônica.

Esta estrutura é um contrato de responsabilidades, não autorização para criar o scaffold nesta fase.

## 5. Build e contrato de deploy

O contrato neutro da futura plataforma será:

| Item | Valor |
| --- | --- |
| Node | Linha 24 LTS |
| Package manager | npm |
| Instalação | `npm ci` |
| Build, Fases 1 a 6 | validações disponíveis, build Astro e verificações automatizadas aplicáveis |
| Build, a partir da Fase 7 | validação completa, build Astro, Pagefind sobre `dist/` e testes finais do artefato |
| Saída | `dist/` |
| Runtime | Nenhum para o artefato estático |

Previews por alteração, domínio, headers, analytics, formulários e rollback pertencem a escolha posterior da hospedagem. Nenhum adapter será instalado preventivamente.

## 6. Política de dependências

- preferir APIs web e recursos oficiais do Astro;
- adicionar dependência somente para requisito identificado e testável;
- não instalar framework cliente por antecipação;
- registrar dependências arquiteturais em `DECISIONS.md`;
- manter versões exatas no lockfile e linha suportada no contrato de ambiente;
- revisar licença, manutenção, custo de bundle e superfície de segurança;
- evitar acoplamento a uma plataforma de hospedagem ou mídia.

## 7. Falhas esperadas e resposta

| Falha | Comportamento exigido |
| --- | --- |
| Schema inválido | Build falha com collection, entrada e campo. |
| Referência ausente | Build falha antes de gerar rotas. |
| Mídia não liberada em conteúdo público | Build falha e identifica todos os usos. |
| Duas edições atuais | Build falha. |
| Agendamento futuro | Entrada e referências ficam ausentes do artefato público. |
| Pagefind falha, a partir da Fase 7 | Build geral falha; não se publica busca desatualizada. |
| Imagem não processada | A página afetada não é publicada silenciosamente. |
| JavaScript indisponível | Leitura, navegação, imagens e contato continuam funcionais. |
| View Transition indisponível | Navegação completa convencional. |

## 8. Gatilhos de revisão arquitetural

Uma nova decisão é obrigatória quando ocorrer qualquer item:

- necessidade real de autenticação, mutação ou dados por usuário;
- formulário com armazenamento ou entrega própria;
- interface cujo estado não seja sustentável em JavaScript nativo;
- derivados acima de 1 GB ou build de CI acima de 10 minutos;
- traduções publicáveis para um segundo idioma;
- requisito de publicação agendada sem intervenção;
- necessidade de renderização sob demanda;
- limitação comprovada das View Transitions nativas;
- troca do Git como origem editorial.
