# Registro de decisões arquiteturais

Status: decisões aceitas para a fundação  
Formato: cada registro descreve contexto, decisão, consequências e gatilho de revisão  
Regra: uma decisão aceita só muda por novo registro que a substitua; não se reescreve silenciosamente o histórico.

## Convenções

- **Aceita:** normativa para a implementação.
- **Adiada:** opções permanecem abertas, mas possuem gatilho objetivo.
- **Substituída:** mantida no histórico e apontando para a nova decisão.
- Corrigendas de edições publicadas também são registradas neste arquivo, com data, motivo e campos alterados.

## ADR-001 — Produto como publicação digital pessoal

**Status:** aceita  
**Contexto:** um portfólio simples não representa textos, arquivo, coleções, recontextualização e crescimento contínuo.  
**Decisão:** tratar o site como quatro sistemas integrados: Trabalhos, Caderno, Arquivo e Presença profissional.  
**Alternativas rejeitadas:** landing page única, blog cronológico e portfólio separado de textos.  
**Consequências:** URLs permanentes, modelo editorial estruturado, navegação multipágina e curadoria possuem prioridade sobre efeitos de página única.  
**Revisão:** somente se a finalidade pública do site mudar de forma material.

## ADR-002 — Homepage como edição curada

**Status:** aceita  
**Contexto:** recência automática impediria recuperar trabalhos antigos e construir pautas.  
**Decisão:** `/` renderiza a única edição pública marcada como atual; edições anteriores permanecem em rotas numeradas.  
**Alternativas rejeitadas:** últimos itens por data e configuração fixa dentro do componente da homepage.  
**Consequências:** a capa pode mudar sem código; a collection `edicoes` passa a ser dependência pública crítica.  
**Revisão:** se a operação editorial deixar de usar edições.

## ADR-003 — Astro 6.x, Node 24 LTS e npm

**Status:** substituída  
**Contexto:** o produto é majoritariamente HTML, texto, imagem e metadados.  
**Decisão:** usar Astro 6.x, Node 24 LTS, npm, lockfile e TypeScript strict. A versão estável exata da linha 6 será fixada ao criar o scaffold.  
**Alternativas rejeitadas:** Next.js, SPA tradicional e Node Current.  
**Consequências:** baixo JavaScript inicial, páginas independentes e build reproduzível; recursos dependentes de servidor não entram por padrão.  
**Revisão:** fim de suporte da linha adotada, requisito de servidor comprovado ou incompatibilidade crítica.
**Substituída por:** ADR-023.

## ADR-004 — Saída estática e hospedagem neutra

**Status:** aceita  
**Contexto:** não há autenticação, personalização, mutações ou banco.  
**Decisão:** gerar `dist/` estático, sem adapter e sem runtime Node em produção; escolher plataforma apenas na Fase 9.  
**Alternativas rejeitadas:** SSR preventivo, self-hosting, Docker/Nginx e acoplamento antecipado a Vercel, Netlify ou Cloudflare.  
**Consequências:** deploy simples e portável; agendamentos dependem de novo build.  
**Revisão:** requisito real de renderização sob demanda, mutação ou recurso de plataforma indispensável.

## ADR-005 — MPA com View Transitions nativas

**Status:** aceita  
**Contexto:** continuidade visual é desejável, mas não deve substituir documentos e histórico nativos.  
**Decisão:** links e navegação MPA são a base; View Transitions nativas entre documentos entram apenas como aprimoramento.  
**Alternativas rejeitadas:** `ClientRouter` na fundação, SPA, scroll interceptado e animações estruturais.  
**Consequências:** funcionamento sem JavaScript e fallback natural; alguns efeitos podem variar por navegador.  
**Revisão:** necessidade concreta impossível de atender com a API nativa, acompanhada de testes de scripts, foco e histórico.

## ADR-006 — Content Collections como fonte editorial

**Status:** aceita  
**Contexto:** um único arquivo de dados não escala para vários tipos e relações.  
**Decisão:** usar `trabalhos`, `caderno`, `colecoes`, `edicoes`, `midia`, `pessoas` e `paginas`, com schemas e referências tipadas.  
**Alternativas rejeitadas:** `site.ts` monolítico, páginas manuais e banco/CMS inicial.  
**Consequências:** conteúdo inválido pode bloquear o build; consultas substituem duplicação de dados.  
**Revisão:** Git deixar de ser origem editorial ou volume/colaboração justificar loader remoto/CMS.

## ADR-007 — Markdown, MDX controlado e YAML por função

**Status:** aceita  
**Contexto:** texto linear, composição editorial e curadoria possuem necessidades distintas.  
**Decisão:** Markdown para texto linear, MDX com vocabulário fechado para composições e YAML para edições/dados curatoriais.  
**Alternativas rejeitadas:** MDX livre em todo conteúdo e páginas programadas individualmente.  
**Consequências:** liberdade editorial delimitada; imports, exports, expressões e componentes arbitrários serão rejeitados.  
**Revisão:** vocabulário insuficiente demonstrado por publicações reais; novos componentes exigem contrato e testes.

## ADR-008 — Catálogo central de mídia

**Status:** aceita  
**Contexto:** fotografias podem reaparecer em trabalhos, textos, coleções e edições; direitos e créditos não podem divergir.  
**Decisão:** `midia` concentra identidade, referência ao arquivo, descrição, crédito, ponto focal e direitos. Para ativos locais, largura, altura e formato são inferidos pelo Astro. `MediaUse` permite somente apresentação contextual.  
**Alternativas rejeitadas:** metadados inteiramente duplicados em cada trabalho e caminhos de imagem livres no MDX.  
**Consequências:** direitos e créditos possuem uma fonte; alt, legenda e corte continuam adaptáveis ao contexto.  
**Revisão:** migração para DAM/serviço remoto, preservando IDs e contrato de uso.

## ADR-009 — Derivados web no Git com limites

**Status:** aceita  
**Contexto:** o horizonte de centenas de derivados ainda permite operação local simples, mas histórico binário pode crescer.  
**Decisão:** versionar derivados web; manter RAW, TIFF, PSD e mestres fora. Revisão obrigatória em 1 GB de derivados ou 10 minutos de build de CI.  
**Alternativas rejeitadas:** incluir originais, escolher Cloudinary/ImageKit agora ou usar Git LFS sem necessidade medida.  
**Consequências:** builds reproduzíveis e sem fornecedor; tamanho do repositório e do build precisa ser monitorado.  
**Revisão:** qualquer limiar atingido ou colaboração prejudicada por clones/uploads.

## ADR-010 — Taxonomia facetada

**Status:** aceita  
**Contexto:** ensaio/retrato descrevem forma, enquanto autoral/comercial descrevem contexto. Uma categoria única misturaria eixos.  
**Decisão:** trabalhos possuem um `formato`, um `contexto`, temas normalizados e relações com coleções; Caderno possui `tipo` próprio.  
**Alternativas rejeitadas:** categoria única e somente tags.  
**Consequências:** filtros combináveis e semântica mais clara; vocabulários controlados exigem migração quando mudarem.  
**Revisão:** corpus real demonstrar que um eixo precisa aceitar múltiplos valores ou novo valor canônico.

## ADR-011 — Associação a coleções declarada no membro

**Status:** aceita  
**Contexto:** armazenar a lista completa nos dois lados criaria divergência.  
**Decisão:** trabalhos e textos declaram suas coleções; páginas de coleção calculam membros. A lista `featured` é apenas um subconjunto curado validado.  
**Alternativas rejeitadas:** listas completas duplicadas em `colecoes`.  
**Consequências:** uma única fonte de pertencimento e consultas reversas no build.  
**Revisão:** fonte editorial remota que ofereça relações transacionais diferentes.

## ADR-012 — Fluxo editorial completo

**Status:** aceita  
**Contexto:** Git como único estado não expressa revisão, agendamento ou preservação fora da circulação.  
**Decisão:** usar `draft`, `review`, `scheduled`, `published` e `archived`, com elegibilidade central.  
**Alternativas rejeitadas:** apenas rascunho/publicado e presença no branch como publicação.  
**Consequências:** todas as superfícies públicas precisam usar a mesma consulta; estados inadequados não podem gerar HTML.  
**Revisão:** adoção de CMS com workflow equivalente; os significados públicos devem ser preservados.

## ADR-013 — Agendamento editorial, sem disparador no primeiro ciclo

**Status:** aceita  
**Contexto:** um site estático não muda quando o relógio passa de `publishAt`.  
**Decisão:** agendamento vencido entra no primeiro build posterior; nenhum cron ou workflow periódico será criado antes da plataforma.  
**Alternativas rejeitadas:** prometer publicação automática e escolher CI/plataforma por antecipação.  
**Consequências:** operação deve iniciar o build; UI/documentação não pode afirmar horário garantido.  
**Revisão:** necessidade operacional de horário automático após escolha da hospedagem.

## ADR-014 — Arquivados preservam URL

**Status:** aceita  
**Contexto:** retirar trabalhos antigos quebraria referências e enfraqueceria o arquivo.  
**Decisão:** `archived` conserva rota, canonical, sitemap e busca, mas sai da homepage, listas padrão e RSS; Arquivo exige filtro explícito.  
**Alternativas rejeitadas:** remover rota, ocultar de toda descoberta ou manter em circulação normal.  
**Consequências:** permanência e contexto histórico, com rótulo claro na busca e página.  
**Revisão:** obrigação legal/editorial de retirada, que exigirá decisão entre redirect, `410` ou bloqueio.

## ADR-015 — Direitos como gate de build

**Status:** aceita  
**Contexto:** avisos podem ser ignorados e não protegem uma publicação fotográfica.  
**Decisão:** apenas mídia e trabalhos `cleared` podem integrar conteúdo público; expiração efetiva também bloqueia.  
**Alternativas rejeitadas:** warning, verificação manual sem schema e direitos repetidos em cada página.  
**Consequências:** falhas de direitos impedem deploy e precisam indicar todos os usos afetados.  
**Revisão:** integração futura com sistema de rights management que ofereça garantia igual ou superior.

## ADR-016 — Edições publicadas com composição imutável

**Status:** aceita  
**Contexto:** histórico de capas perde sentido se ordem e destaques mudarem retroativamente.  
**Decisão:** blocos, ordem, referências e tratamentos são imutáveis depois da publicação. Correções do conteúdo referenciado permanecem vivas.  
**Alternativas rejeitadas:** snapshot integral duplicado e referências totalmente mutáveis.  
**Consequências:** preserva a decisão editorial sem duplicar páginas; a CI compara a composição com a branch-base, e exceções exigem incremento de revisão e corrigenda.  
**Revisão:** requisito arquivístico de reprodução visual integral, que justificaria snapshots.

## ADR-017 — CSS nativo e sistema visual próprio

**Status:** aceita  
**Contexto:** a linguagem depende de tipografia, grids assimétricos, ritmo, impressão e tratamento fotográfico.  
**Decisão:** usar CSS nativo organizado por responsabilidade, sem Tailwind, Bootstrap, Material UI ou kit genérico.  
**Alternativas rejeitadas:** framework utilitário ou biblioteca visual na fundação.  
**Consequências:** controle direto da cascata e maior responsabilidade por documentar tokens e componentes.  
**Revisão:** problema de manutenção medido que não possa ser resolvido pelo sistema próprio.

## ADR-018 — Nenhum framework cliente inicialmente

**Status:** aceita  
**Contexto:** menu, busca, filtros, diálogos e galerias pequenas não justificam runtime de framework antecipado.  
**Decisão:** usar JavaScript nativo apenas onde necessário; ilhas de framework continuam uma opção localizada futura do Astro.  
**Alternativas rejeitadas:** React/Vue/Svelte/Preact na fundação.  
**Consequências:** menos JavaScript e dependências; interações precisam manter escopo disciplinado.  
**Revisão:** interface real com estado complexo, como filtros multidimensionais extensos, mapa ou comparação avançada.

## ADR-019 — Pagefind para busca estática

**Status:** aceita  
**Contexto:** o acervo precisa de busca sem criar servidor.  
**Decisão:** a partir da Fase 7, executar Pagefind sobre `dist/`, usar sua API com interface própria e indexar metadados editoriais.  
**Alternativas rejeitadas:** servidor de busca, banco e componente visual genérico obrigatório.  
**Consequências:** Pagefind fica ausente da Fase 1 e torna-se obrigatório na Fase 7; depois da integração, a busca depende do build, funciona inteiramente como ativo estático e deve falhar junto com o pipeline se o índice não for atualizado.  
**Revisão:** escala ou requisitos de ranking/tempo real excederem comprovadamente o Pagefind.

## ADR-020 — Português único com chaves de tradução preparadas

**Status:** aceita  
**Contexto:** um seletor sem traduções reais reduz credibilidade, mas migrar IDs depois seria custoso.  
**Decisão:** publicar apenas `pt-BR`, sem `/en`, e exigir `translationKey` desde o início.  
**Alternativas rejeitadas:** rotas vazias, tradução parcial ou ausência de identidade entre traduções.  
**Consequências:** interface honesta e modelo pronto para pares futuros.  
**Revisão:** existência de um conjunto completo, revisado e sustentável em outro idioma.

## ADR-021 — Contato direto, sem formulário

**Status:** aceita  
**Contexto:** formulário implica endpoint, antispam, entrega, privacidade, retenção e monitoramento.  
**Decisão:** usar página com e-mail e canais diretos aprovados.  
**Alternativas rejeitadas:** endpoint ou serviço de formulário antes da escolha de plataforma.  
**Consequências:** nenhuma coleta própria no primeiro ciclo; menor superfície operacional.  
**Revisão:** necessidade de triagem estruturada e plataforma capaz de sustentar o fluxo completo.

## ADR-022 — Documentação com fontes canônicas separadas

**Status:** aceita  
**Contexto:** repetir contratos em vários documentos favorece contradições.  
**Decisão:** `BRIEF` define produto, `ARCHITECTURE` sistema, `CONTENT_MODEL` contratos, `PLAN` sequência e `DECISIONS` histórico/racional.  
**Alternativas rejeitadas:** documento único e repetição integral entre arquivos.  
**Consequências:** outros documentos usam links e resumos, sem redefinir a fonte canônica.  
**Revisão:** crescimento da documentação justificar novos documentos com responsabilidades distintas.

## ADR-023 — Astro 7.x, Node 24 LTS e npm

**Status:** aceita  
**Contexto:** antes da criação do scaffold, a linha normativa do Astro foi atualizada para a major estável corrente, preservando a saída estática e a compatibilidade com o ambiente LTS adotado.  
**Decisão:** Astro 7.x, fixado pelo lockfile na versão estável validada no início da Fase 1. Usar Node.js 24 LTS, npm e TypeScript strict.  
**Alternativas rejeitadas:** iniciar o scaffold em Astro 6.x, adotar Node Current, trocar de framework ou deixar versões sem lockfile.  
**Consequências:** a Fase 1 começa na linha suportada documentada e mantém builds reproduzíveis. Como ainda não existe scaffold nem código de aplicação, esta substituição documental não exige migração de código.  
**Revisão:** fim de suporte da linha adotada, requisito de servidor comprovado ou incompatibilidade crítica.

## Decisões adiadas com gatilho

| Tema | Estado atual | Gatilho de decisão |
| --- | --- | --- |
| Fontes definitivas | Nenhuma selecionada | Fase 3, após testes de licença, português, legibilidade, desempenho e Windows. |
| Hospedagem | Plataforma gerenciada não escolhida | Fase 9, com tamanho e tempo de build reais. |
| Analytics | Ausente | Objetivo mensurável, avaliação de privacidade e orçamento de desempenho. |
| Formulário | Ausente | Plataforma escolhida e operação de endpoint/antispam/privacidade definida. |
| Mídia remota ou Git LFS | Ausente | Derivados acima de 1 GB, CI acima de 10 minutos ou clone prejudicado. |
| Internacionalização | Preparada, inativa | Traduções completas e revisadas para segundo idioma. |
| Framework cliente | Ausente | Estado complexo comprovado e delimitado a uma ilha. |
| Agendamento automático | Ausente | Exigência operacional após escolha de deploy. |
| CMS | Ausente | Colaboração editorial não técnica tornar Git inadequado. |

## Corrigendas de edições

Nenhuma. Cada futura entrada deve registrar:

- data e responsável;
- número da edição;
- campos alterados;
- motivo;
- impacto em URL, composição e conteúdos referenciados;
- aprovação editorial.
