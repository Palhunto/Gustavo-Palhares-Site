# Brief do produto

Status: congelado para a fundação do projeto  
Idioma deste documento: português do Brasil  
Fonte canônica: este documento define produto, público, objetivos e limites. Contratos de conteúdo pertencem a [CONTENT_MODEL.md](./CONTENT_MODEL.md); arquitetura técnica, a [ARCHITECTURE.md](./ARCHITECTURE.md); sequência de entrega, a [PLAN.md](./PLAN.md).

## 1. Definição do produto

O site de Gustavo Palhares será uma **publicação digital pessoal**. Ele não será tratado apenas como portfólio, blog, catálogo cronológico nem landing page comercial.

O produto reunirá quatro sistemas complementares:

| Sistema | Função |
| --- | --- |
| Trabalhos | Apresentar ensaios, coberturas, retratos e projetos fotográficos em contextos autorais, editoriais ou comerciais. |
| Caderno | Publicar notas, processos, críticas, reportagens, investigações e ensaios textuais. |
| Arquivo | Permitir exploração visual, cronológica e editorial do conjunto publicado. |
| Presença profissional | Explicar quem é Gustavo, demonstrar repertório e oferecer meios diretos de contato. |

A proposta central é combinar a permanência de um arquivo com a capacidade de reeditar sua porta de entrada. Conteúdos antigos permanecem endereçáveis e podem voltar a ganhar destaque quando uma nova pauta, coleção ou edição os tornar relevantes.

## 2. Públicos

O produto atende a um público misto, sem transformar um grupo em obstáculo para o outro.

### 2.1 Público profissional

- contratantes, produtoras, agências e clientes;
- editores, curadores, jornalistas e veículos;
- artistas, coletivos e possíveis colaboradores.

Esse público precisa reconhecer rapidamente autoria, consistência, campos de atuação, créditos, contexto e um caminho confiável de contato.

### 2.2 Público editorial

- leitores interessados em fotografia, cultura e processos criativos;
- pesquisadores e pessoas que chegam por uma obra, tema, cidade, pessoa ou acontecimento;
- visitantes recorrentes que acompanham o Caderno e as novas edições.

Esse público precisa conseguir ler, explorar relações e retornar a itens antigos sem que o site pareça uma vitrine descartável.

### 2.3 Prioridade de experiência

A hierarquia deve equilibrar descoberta editorial e clareza profissional. A homepage não deve se converter em uma tabela de serviços, e o arquivo não deve esconder autoria ou contato. Em qualquer página pública, deve ser possível:

1. identificar onde se está;
2. entender o que está sendo visto ou lido;
3. navegar para conteúdos relacionados;
4. chegar a informações sobre Gustavo e aos meios de contato.

## 3. Objetivos

### 3.1 Objetivos do produto

- apresentar trabalhos fotográficos com composição editorial adequada a cada narrativa;
- publicar texto e imagem sob o mesmo sistema de autoria;
- preservar URLs e relações editoriais ao longo do crescimento do acervo;
- permitir curadoria manual da capa sem depender da data mais recente;
- tornar coleções, temas, lugares e pessoas caminhos reais de descoberta, respeitando no primeiro ciclo os canais definidos para créditos e busca;
- oferecer uma presença profissional direta, sem infraestrutura desnecessária;
- manter o produto acessível, rápido e compreensível sem JavaScript.

### 3.2 Critérios de sucesso da fundação

A fundação será considerada bem-sucedida quando:

- um novo trabalho, texto, ativo de mídia, coleção ou edição puder ser adicionado por conteúdo estruturado, sem criar uma página especial;
- erros de schema, referências, publicação ou direitos impedirem o build antes de chegar ao público;
- cada trabalho e texto tiver URL, metadados, HTML e navegação independentes;
- a homepage puder ser reeditada sem alterar componentes;
- conteúdos antigos permanecerem acessíveis e recuperáveis;
- busca, arquivo, RSS, sitemap e metadados derivarem da mesma fonte de conteúdo público;
- a ausência de JavaScript preservar leitura, links, imagens, contato e navegação principal;
- a futura troca de hospedagem ou de serviço de mídia não exigir reconstruir o modelo editorial.

## 4. Princípios editoriais

### 4.1 A homepage é uma edição

A rota `/` apresenta exatamente uma entrada de `edicoes` marcada como atual. Ordem, tratamentos, chamadas e destaques são escolhas editoriais explícitas. Recência pode informar a curadoria, mas nunca decide a capa automaticamente.

Edições publicadas ganham uma rota permanente em `/edicoes/[numero]`. Sua composição é imutável; correções feitas no conteúdo referenciado continuam visíveis nas páginas próprias. Qualquer mudança excepcional de uma composição publicada exige uma corrigenda em [DECISIONS.md](./DECISIONS.md).

### 4.2 Cronologia não é hierarquia

Datas permitem ordenar e contextualizar, mas trabalhos podem reaparecer em novas edições e coleções. A ordem cronológica será apenas um dos modos do Arquivo.

### 4.3 Coleções são argumentos editoriais

Uma coleção reúne trabalhos e textos por uma relação curatorial. Ela não substitui formato, contexto ou tema. Um item pode pertencer a várias coleções.

### 4.4 Publicar exige contexto e responsabilidade

Nenhuma fotografia pública pode estar sem crédito e situação de direitos definida como `cleared`. Texto alternativo deve comunicar a função da imagem naquele uso, e não apenas repetir uma legenda genérica.

### 4.5 A experiência é progressiva

HTML, links e rolagem nativa formam o produto essencial. Transições, busca no cliente, filtros, lightbox e outras interações aprimoram essa base; não podem ser requisitos para acessar o conteúdo.

### 4.6 Mobile é uma composição própria

A hierarquia editorial permanece, mas a composição deve ser reinterpretada para telas menores. O mobile não será uma miniatura comprimida de um layout semelhante a jornal.

## 5. Arquitetura da informação e rotas

| Rota | Papel |
| --- | --- |
| `/` | Edição atual e capa curada. |
| `/trabalhos` | Índice padrão de trabalhos publicados. |
| `/trabalhos/[slug]` | Página permanente de um trabalho. |
| `/caderno` | Índice de textos publicados. |
| `/caderno/[slug]` | Página permanente de um texto. |
| `/arquivo` | Exploração visual, cronológica e editorial, incluindo filtro explícito de arquivados. |
| `/arquivo/[faceta]/[valor]` | Índices pré-renderizados para navegação sem JavaScript por ano, cidade, formato, contexto, tema ou coleção. |
| `/colecoes` | Índice de coleções publicadas. |
| `/colecoes/[slug]` | Contexto e membros de uma coleção. |
| `/edicoes` | Histórico das capas publicadas. |
| `/edicoes/[numero]` | Composição permanente de uma edição. |
| `/sobre` | Biografia, prática, disponibilidade e informações institucionais. |
| `/contato` | Meios diretos de contato, sem formulário próprio no primeiro ciclo. |
| `/busca` | Interface de busca estática. |
| `/rss.xml` | Feed de trabalhos e textos elegíveis: `published` e `scheduled` vencidos no instante do build, sem itens arquivados. |
| `/404` | Recuperação de navegação e acesso ao arquivo/busca. |

No primeiro ciclo, `pessoas` é uma collection interna, sem rota `/pessoas` e sem faceta pública no Arquivo. Pessoas são descobertas por créditos renderizados, textos, trabalhos relacionados e busca. Páginas públicas de pessoas permanecem uma evolução futura.

Não haverá rota `/en`, seletor de idioma ou interface que prometa tradução enquanto só existir conteúdo em português. `locale` e `translationKey` serão gravados desde a fundação para permitir internacionalização real no futuro.

## 6. Escopo do primeiro ciclo

### Incluído

- fundação Astro com saída estática;
- modelo editorial e catálogo central de mídia;
- páginas internas e homepage por edição;
- arquivo em modos visual, cronológico e editorial;
- busca Pagefind;
- componentes editoriais de imagem e texto;
- SEO técnico, sitemap, RSS e compartilhamento;
- acessibilidade estrutural e progressiva;
- validações de conteúdo, referências, direitos e publicação;
- testes automatizados e verificações manuais definidos no plano;
- contrato de deploy neutro de plataforma.

### Deliberadamente fora

- CMS;
- backend, banco de dados ou Astro Actions;
- formulário próprio;
- autenticação e contas de usuário;
- pagamentos ou e-commerce;
- comentários, curtidas ou personalização;
- React, Vue, Svelte, Preact ou outro framework cliente na fundação;
- SPA ou `ClientRouter`;
- servidor próprio, Docker de produção, Nginx ou systemd;
- versão em outro idioma sem traduções reais;
- seleção definitiva de fontes, hospedagem, analytics ou provedor remoto de mídia.

Esses itens não são proibidos para sempre. Sua adoção exige um problema comprovado, um gatilho registrado e nova decisão em [DECISIONS.md](./DECISIONS.md).

## 7. Contato e conversão

O primeiro ciclo usa meios diretos configurados editorialmente: e-mail e, se aprovados antes da publicação, WhatsApp e Instagram. A página de contato explica o canal adequado e oferece links convencionais. Não coleta nem armazena dados do visitante.

Um formulário só poderá entrar depois da escolha da plataforma e da definição conjunta de endpoint, validação, antispam, entrega, privacidade, retenção, monitoramento e tratamento de falhas.

## 8. O que este brief não decide

- schemas e invariantes detalhados: [CONTENT_MODEL.md](./CONTENT_MODEL.md);
- implementação e fluxo de build: [ARCHITECTURE.md](./ARCHITECTURE.md);
- ordem e gates das fases: [PLAN.md](./PLAN.md);
- histórico e justificativa das escolhas: [DECISIONS.md](./DECISIONS.md).
