# Modelo de conteúdo

Status: fonte canônica dos contratos editoriais  
Escopo: collections, campos, relações, taxonomias, estados, direitos e invariantes  
Implementação futura: schemas Zod e validação transversal conforme [ARCHITECTURE.md](./ARCHITECTURE.md)

## 1. Convenções globais

### 1.1 Identidade

- Cada arquivo de conteúdo possui um ID interno estável derivado de seu nome, em kebab-case ASCII.
- O ID nunca muda, nunca é reutilizado e é a chave usada nas referências entre collections.
- Entradas com rota possuem também `slug`, igualmente em kebab-case ASCII.
- O slug é único dentro de seu namespace de rota. Uma alteração futura de slug exigirá redirect; até existir política de redirects, slugs publicados são imutáveis.
- `translationKey` identifica o mesmo conteúdo entre idiomas e é obrigatória desde a fundação. No primeiro ciclo, ela pode ser igual ao ID.
- `locale` tem valor único permitido `pt-BR` até existirem traduções publicáveis.

Regex conceitual para ID e slug: início e fim alfanuméricos, com palavras separadas apenas por hífen; sem espaços, acentos, underscore ou hífens consecutivos.

### 1.2 Datas

- Instantes editoriais, como `publishAt` e `updatedAt`, usam ISO 8601 com offset explícito, por exemplo `2026-07-20T09:00:00-03:00`.
- Datas históricas sem horário usam `YYYY-MM-DD`.
- A data editorial de comparação e exibição adota `America/Sao_Paulo`.
- `updatedAt` nunca pode preceder `publishAt`.
- Um intervalo exige início e fim; o fim não pode preceder o início.

### 1.3 Campos editoriais comuns

As collections com página pública compartilham:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `slug` | string | Obrigatório, estável e único no namespace. |
| `title` | string | Obrigatório, não vazio, em texto simples. |
| `summary` | string | Obrigatório; descreve o item sem depender da capa. |
| `locale` | enum | Apenas `pt-BR` no primeiro ciclo. |
| `translationKey` | string | Obrigatória e estável. |
| `status` | enum | `draft`, `review`, `scheduled`, `published` ou `archived`. |
| `publishAt` | datetime | Obrigatório para `scheduled`, `published` e `archived`. |
| `updatedAt` | datetime | Opcional; deve ser posterior ou igual a `publishAt`. |
| `seo` | objeto | Overrides opcionais; os defaults derivam de título e resumo. |

O objeto `seo` aceita:

- `title`: título alternativo para mecanismos de busca;
- `description`: descrição alternativa;
- `socialImage`: referência a `midia` com direitos liberados;
- `noindex`: permitido apenas para páginas utilitárias; proibido em trabalhos, textos, coleções e edições publicados.

Canonical e URL social são gerados pela rota e não são campos autorais. Um canonical manual só poderá existir junto de uma política futura de migração.

## 2. Estados e elegibilidade pública

### 2.1 Estados declarados

| Estado | Significado | Rota/HTML | Listagens | Busca | Sitemap | RSS |
| --- | --- | --- | --- | --- | --- | --- |
| `draft` | Edição inicial. | Não | Não | Não | Não | Não |
| `review` | Conteúdo pronto para revisão editorial/direitos. | Não | Não | Não | Não | Não |
| `scheduled` futuro | Aprovado, aguardando horário e novo build. | Não | Não | Não | Não | Não |
| `scheduled` vencido | Publicável no primeiro build executado após `publishAt`. | Sim | Sim | Sim | Sim | Sim, quando aplicável |
| `published` | Público corrente. | Sim | Sim | Sim | Sim | Sim, quando aplicável |
| `archived` | Público preservado, retirado da circulação padrão. | Sim | Apenas em filtro explícito | Sim, com rótulo | Sim | Não |

`scheduled` não dispara build. A plataforma futura poderá automatizar o disparo, mas o contrato de elegibilidade permanece o mesmo.

### 2.2 Função de elegibilidade

Uma entrada é efetivamente pública quando:

- seu estado é `published` ou `archived`; ou
- seu estado é `scheduled` e `publishAt` é menor ou igual ao instante do build;
- todos os campos obrigatórios do tipo estão presentes;
- suas referências publicamente renderizadas existem e são elegíveis;
- toda mídia renderizada possui direitos `cleared`;
- a liberação editorial do trabalho, quando aplicável, é `cleared`.

Uma entrada pública não pode depender de uma entrada `draft`, `review` ou de agendamento futuro. A validação deve listar o caminho completo da referência que causou a falha.

### 2.3 Elegibilidade do RSS

O RSS reutiliza a função central de elegibilidade. Inclui trabalhos e textos `published` e `scheduled` cujo `publishAt` seja menor ou igual ao instante do build. Exclui `draft`, `review`, `scheduled` futuro e `archived`.

## 3. Taxonomias

### 3.1 Trabalhos

`formato` possui exatamente um valor:

- `ensaio`;
- `cobertura`;
- `retrato`;
- `projeto`.

`contexto` possui exatamente um valor:

- `autoral`;
- `editorial`;
- `comercial`.

Formato descreve a forma do trabalho; contexto descreve a condição de realização. Nenhum dos dois substitui tema ou coleção.

### 3.2 Caderno

`tipo` possui exatamente um valor:

- `nota`;
- `processo`;
- `critica`;
- `reportagem`;
- `investigacao`;
- `ensaio`.

### 3.3 Temas

Temas são tags editoriais livres, mas normalizadas:

- escritos em português, Unicode NFC e letras minúsculas;
- espaços internos reduzidos a um;
- sem pontuação final;
- sem duplicatas na mesma entrada;
- variantes que normalizam para a mesma chave, como diferenças apenas de caixa ou espaço, fazem o build falhar;
- singular e plural não são unificados automaticamente; a revisão editorial escolhe um termo canônico.

Exemplos canônicos: `musica ao vivo`, `bauru noturna`, `trabalho e cidade`.

## 4. Collection `midia`

`midia` é a fonte central de identidade e direitos de cada derivado fotográfico ou gráfico.

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| ID da entrada | Sim | Estável e referenciado por todos os usos. |
| `src` | Sim | Referência validada a uma imagem local aprovada sob `src/`, resolvida pelo contrato de imagem do Astro. |
| `description` | Sim | Descrição factual da imagem, sem interpretar sua função na página. |
| `defaultAlt` | Sim | Texto alternativo padrão; pode ser substituído por contexto. |
| `defaultCaption` | Não | Legenda editorial padrão. |
| `credit` | Sim | Referência a `pessoas` ou crédito textual externo. |
| `capturedAt` | Não | Data ou datetime da captura. |
| `location` | Não | Local estruturado. |
| `focalPoint` | Não | Percentuais `x` e `y`, ambos entre 0 e 100. |
| `rights` | Sim | Objeto de direitos descrito abaixo. |
| `checksum` | Recomendado | Permite detectar substituição silenciosa do arquivo. |

Largura, altura e formato são derivados dos metadados do ativo local validados pelo Astro. Não são campos de autoria e não podem divergir do arquivo.

O objeto `rights` possui:

| Campo | Regra |
| --- | --- |
| `status` | `pending`, `cleared`, `restricted` ou `expired`. |
| `holder` | Obrigatório; pessoa ou entidade titular. |
| `basis` | Obrigatório quando `cleared`; enum `authorship`, `written-authorization`, `commissioned-use`, `license` ou `public-domain`. |
| `scope` | Obrigatório quando houver limitação de uso. |
| `expiresAt` | Obrigatório quando o direito tiver prazo. |
| `notes` | Opcional e interno; nunca renderizado automaticamente. |
| `evidenceRef` | Opcional e interno; identificador de evidência mantida em sistema externo autorizado, nunca renderizado. |

`expiresAt` anterior ou igual ao instante do build torna o estado efetivo `expired`, ainda que o arquivo tenha sido deixado como `cleared`; o build deve falhar se houver uso público.

As bases `license` e `written-authorization` exigem `scope`, `expiresAt` ou `notes` sempre que esses elementos fizerem parte dos termos aplicáveis. `evidenceRef` nunca contém a própria evidência, documentos privados, tokens, dados pessoais sensíveis ou arquivos jurídicos no repositório.

### 4.1 Uso contextual de mídia

Trabalhos, textos e edições não repetem direitos, crédito, dimensões ou caminho. Eles usam um objeto `MediaUse`:

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `asset` | Sim | Referência a `midia`. |
| `decorative` | Sim | Booleano explícito. |
| `altOverride` | Condicional | Necessário quando o default não descreve a função contextual. Proibido se `decorative` for verdadeiro. |
| `captionOverride` | Não | Substitui apenas a legenda neste uso. |
| `crop` | Não | Proporção e/ou ponto focal contextual. |
| `loading` | Não | Apenas `eager` para imagem crítica ou `lazy`; default definido pelo componente. |

Se `decorative` for falso, `altOverride` ou `defaultAlt` precisa resultar em texto não vazio. Se for verdadeiro, o componente renderiza alt vazio e não anuncia legenda como substituto.

## 5. Collection `pessoas`

Collection interna para autoria e créditos recorrentes, sem rota `/pessoas` e sem faceta pública de pessoas no Arquivo durante o primeiro ciclo.

Campos:

- ID estável;
- `name` obrigatório;
- `sortName` opcional;
- `roleLabel` opcional;
- `url` opcional e validada;
- `sameAs` opcional para perfis públicos;
- `bio` curta opcional;
- `public` booleano que controla se bio e links podem ser renderizados; não cria rota pública.

Um crédito pode usar uma referência a `pessoas` ou um nome textual externo. Não se cria uma pessoa permanente apenas para satisfazer um crédito pontual. Dados privados de contato nunca pertencem a esta collection. No primeiro ciclo, pessoas são descobertas por créditos renderizados, textos, trabalhos relacionados e busca; páginas públicas de pessoas permanecem evolução futura.

## 6. Collection `trabalhos`

Formato autoral: MDX controlado para composição editorial. Markdown pode ser aceito quando não houver componentes especiais.

Campos além da base comum:

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `archiveNumber` | Sim | Formato `GP-YYYY-NNNN`, único, crescente dentro de cada ano e imutável. `YYYY` é o ano de `date`; `NNNN` é a sequência do ano. |
| `date` | Sim | Data principal do trabalho. |
| `dateEnd` | Não | Para intervalo; não pode preceder `date`. |
| `location` | Não | Cidade, subdivisão e país; cidade alimenta filtros. |
| `formato` | Sim | Enum da seção 3.1. |
| `contexto` | Sim | Enum da seção 3.1. |
| `themes` | Não | Lista de temas normalizados. |
| `collections` | Não | Referências a `colecoes`; fonte canônica de associação. |
| `cover` | Sim | `MediaUse` não decorativo. |
| `gallery` | Sim | Lista ordenada com pelo menos um `MediaUse`. |
| `credits` | Sim | Lista com papel e pessoa/crédito externo; fotografia precisa estar explícita. |
| `publicationClearance` | Sim | Mesmo enum de direitos; precisa ser `cleared` quando público. |
| `relatedWorks` | Não | Referências manuais a outros trabalhos. |

O corpo MDX pode usar apenas o vocabulário fechado de [ARCHITECTURE.md](./ARCHITECTURE.md). Todo ativo usado no corpo também precisa aparecer como referência resolúvel; strings livres com caminhos de arquivo são proibidas.

Para trabalho antigo incorporado posteriormente, `date` e o segmento `YYYY` registram o ano de produção, nunca o ano de ingestão no site. Números de arquivo não são reutilizados depois da remoção ou do arquivamento de uma entrada.

## 7. Collection `caderno`

Markdown é o formato padrão. MDX controlado é permitido apenas quando a pauta exigir composição editorial.

Campos além da base:

- `tipo`: enum da seção 3.2;
- `date`: data editorial ou histórica do texto;
- `authors`: ao menos uma referência/crédito, com Gustavo como default explícito, nunca implícito;
- `cover`: `MediaUse` opcional;
- `themes`: lista opcional de temas;
- `collections`: referências opcionais a `colecoes`;
- `relatedWorks`: referências opcionais a `trabalhos`;
- `relatedNotebook`: referências opcionais a outros textos;
- `credits`: lista opcional para imagem, edição, tradução ou pesquisa.

Textos sem imagem continuam válidos. Quando houver mídia, as mesmas regras de direitos e contexto se aplicam.

## 8. Collection `colecoes`

Uma coleção é uma entidade editorial, não uma pasta técnica.

Campos:

- campos editoriais comuns;
- `description` longa opcional no corpo;
- `cover` opcional, com direitos liberados quando pública;
- `themes` opcionais;
- `featured`, lista ordenada opcional de objetos com `kind` (`trabalho` ou `caderno`) e ID;
- `curatorNote` opcional;
- `relatedCollections` opcional.

A associação canônica fica em `trabalhos.collections` ou `caderno.collections`. Cada item de `featured` precisa apontar para um membro real em circulação (`published` ou agendamento vencido), nunca `archived`. A ausência de `featured` produz ordenação editorial padrão documentada na interface; não autoriza gravar a lista completa dos membros novamente. Membros arquivados só aparecem no Arquivo com filtro explícito.

## 9. Collection `edicoes`

YAML é o formato canônico. O ID é o número da edição, com preenchimento de três dígitos, por exemplo `001`.

Campos:

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `number` | Sim | Inteiro positivo, único; a rota formata com três dígitos. |
| `period` | Sim | Rótulo editorial, como `julho de 2026`. |
| `title` | Sim | Título da edição. |
| `summary` | Sim | Apresentação independente da homepage. |
| `status`, `publishAt` | Sim conforme estado | Mesmas regras globais. |
| `current` | Sim | Booleano; exatamente uma edição efetivamente pública e atual. |
| `blocks` | Sim | Composição ordenada, não vazia. |
| `compositionRevision` | Sim | Inteiro iniciado em `1`; só muda por corrigenda. |
| `corrigendaDecision` | Condicional | Referência a entrada de corrigenda quando uma composição pública muda. |

Tipos iniciais de bloco:

- `hero`: uma referência principal, imagem e tratamento;
- `work-grid`: lista ordenada de trabalhos e variante de grade;
- `notebook-list`: lista ordenada de textos;
- `collection-feature`: uma coleção e seus destaques contextuais;
- `text-callout`: chamada editorial curta sem criar publicação autônoma.

Tratamentos são enums definidos pelo componente correspondente, não nomes de classes CSS. Ao publicar uma edição, suas referências precisam estar em circulação no mesmo build. A edição atual nunca pode apontar para conteúdo `archived`; edições históricas podem continuar exibindo uma referência que tenha sido arquivada depois. Uma edição `archived` não pode ser `current`.

Depois que a edição se torna efetivamente pública, `blocks`, ordem, referências e tratamentos são imutáveis. A CI compara a composição de edições já publicadas com a versão da branch-base. Campos de correção textual podem mudar sem alterar composição. Uma exceção exige incrementar `compositionRevision`, preencher `corrigendaDecision` e criar a corrigenda datada correspondente em [DECISIONS.md](./DECISIONS.md).

## 10. Collection `paginas`

Conteúdo institucional em Markdown, inicialmente limitado aos IDs `sobre` e `contato`.

Campos:

- campos editoriais comuns;
- `pageType`: `about` ou `contact`;
- `contactLinks`: apenas em `contato`, com rótulo, URL/protocolo e ordem;
- `portrait`: `MediaUse` opcional em `sobre`;
- corpo Markdown.

Não há formulário, segredo, token, endereço privado ou dado submetido por usuário. Links de contato são validados quanto ao protocolo permitido.

## 11. Relações e fonte de verdade

| Relação | Declarada em | Derivação |
| --- | --- | --- |
| Item pertence a coleção | Trabalho ou Caderno | Página da coleção consulta referências reversas. |
| Destaque de coleção | Coleção | Deve ser subconjunto dos membros derivados. |
| Mídia usada por conteúdo | Objeto `MediaUse` no conteúdo | Crédito e direitos são lidos de `midia`. |
| Crédito recorrente | Referência a `pessoas` | Nome e links públicos derivam da pessoa. |
| Conteúdo em edição | `edicoes.blocks` | Homepage e histórico usam a mesma composição. |
| Relacionados | Entrada que faz a recomendação | Não é automaticamente simétrico. |

Não manter relações bidirecionais duplicadas. Quando uma relação reversa for necessária, ela será consultada ou calculada no build.

## 12. Validações transversais obrigatórias

O build falha quando houver:

- ID, slug, `translationKey` ou `archiveNumber` inválido/duplicado no escopo correspondente;
- referência ausente ou de tipo incorreto;
- rota colidente;
- entrada pública dependente de entrada não pública;
- mídia pública com direitos diferentes de `cleared` ou licença expirada;
- mídia com direitos `cleared` sem `basis` válido;
- `evidenceRef` que exponha evidência, documento privado, token, dado pessoal sensível ou arquivo jurídico no repositório;
- trabalho público com `publicationClearance` diferente de `cleared`;
- crédito fotográfico ausente;
- `MediaUse` não decorativo sem alt efetivo;
- destaque que não pertence a sua coleção;
- destaque de coleção ou edição atual apontando para conteúdo `archived`;
- zero ou mais de uma edição atual pública;
- edição atual arquivada ou futura;
- data incoerente com estado;
- tag vazia, duplicada ou colidente após normalização;
- MDX com import, export, expressão ou componente fora da allowlist;
- modificação da composição de uma edição já publicada sem nova revisão e corrigenda correspondente.

Avisos que não bloqueiam o build podem cobrir comprimento recomendado de SEO, ausência de legenda opcional, arquivo grande e falta de relacionados. Um aviso nunca substitui um gate de direitos, privacidade ou publicação.

## 13. Exemplos de comportamento

### 13.1 Uso contextual válido

A fotografia `palco-001` guarda arquivo, crédito, direitos e descrição factual uma única vez. Na capa de um trabalho, o uso pode descrevê-la como “Cantora se inclina em direção ao público sob luz vermelha”. Em uma grade pequena da edição, o mesmo ativo pode usar “Cantora sob luz vermelha durante apresentação”. Nenhum uso repete nem pode substituir o crédito ou o estado de direitos.

### 13.2 Conteúdo arquivado válido

Um trabalho `archived` conserva `/trabalhos/seu-slug`, canonical, sitemap e resultado de busca identificado como arquivado. Ele não aparece na homepage, em `/trabalhos`, no RSS nem no Arquivo sem o filtro explícito de arquivados.

### 13.3 Agendamento válido

Uma entrada `scheduled` com `publishAt` no futuro não produz HTML. Depois do horário, ela continua ausente até que um novo build seja executado; nesse build passa a ser elegível, desde que referências e direitos estejam válidos.

### 13.4 Casos inválidos

- trabalho `published` cuja capa aponta para mídia `pending`;
- edição atual que destaca texto em `review`;
- duas entradas com o mesmo slug em `trabalhos`;
- coleção que destaca um item que não declara pertencer a ela;
- imagem não decorativa sem `defaultAlt` nem `altOverride`;
- edição `002` publicada cuja ordem foi alterada sem corrigenda;
- MDX que importa um componente local ou executa uma expressão;
- direitos `cleared` com `expiresAt` já vencido.

## 14. Evolução futura

As seguintes extensões são permitidas sem mudar a identidade do produto, mas exigem decisão e migração documentadas:

- novo idioma e rotas internacionalizadas;
- catálogo remoto ou CMS como loader das mesmas collections;
- serviço remoto de mídia preservando IDs e `MediaUse`;
- página pública para pessoas;
- automação real de agendamento;
- novos tipos de bloco ou componentes MDX;
- redirects para slugs publicados alterados.
