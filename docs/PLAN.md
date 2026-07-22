# Plano de implementação

Status: sequência congelada; nenhuma fase de código foi iniciada  
Pre-condição global: [BRIEF.md](./BRIEF.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [CONTENT_MODEL.md](./CONTENT_MODEL.md), este plano e [DECISIONS.md](./DECISIONS.md) aprovados em conjunto

## 1. Regras de execução

- As fases são sequenciais quanto aos seus gates, ainda que tarefas internas independentes possam ocorrer em paralelo.
- Uma fase só termina quando todos os seus critérios de saída forem demonstrados.
- Alteração de produto ou contrato atualiza primeiro o documento canônico e `DECISIONS.md`.
- Conteúdo de exemplo deve exercer casos reais; placeholders não validam a arquitetura.
- Homepage visual não antecede modelo editorial, sistema visual nem componentes.
- Nenhuma plataforma, framework cliente ou serviço remoto entra preventivamente.
- Acessibilidade, SEO, direitos e funcionamento sem JavaScript são requisitos de cada fase, não um acabamento final.

## 2. Fase 0 — Congelamento documental

### Objetivo

Eliminar decisões abertas que impediriam um scaffold coerente.

### Dependências

Nenhuma.

### Entregáveis

- os cinco documentos fundadores;
- responsabilidades documentais sem sobreposição;
- stack, collections, rotas, estados, direitos e fontes de verdade definidos;
- lista explícita de decisões futuras e seus gatilhos.

### Critérios de saída

- os cinco arquivos foram revisados em conjunto;
- não há contradição entre rotas, estados, taxonomias, collections e fases;
- exemplos cobrem arquivamento, agendamento, direitos e uso contextual de mídia;
- links oficiais e internos estão válidos;
- não existem `TBD` sem dono ou gatilho;
- nenhuma pasta de aplicação, manifesto ou código foi criado.

### Adiado

Todo scaffold, escolha visual e importação de conteúdo.

## 3. Fase 1 — Fundação

### Objetivo

Criar um ambiente mínimo, reproduzível e verificável para o sistema documentado.

### Dependências

Fase 0 aprovada.

### Entregáveis

- Astro 7.x, fixado pelo lockfile na versão estável validada no início da Fase 1;
- Node 24 LTS declarado, npm e lockfile;
- TypeScript strict, formatação, lint e `astro check`;
- estrutura de responsabilidades definida na arquitetura;
- CI com instalação limpa, validação e build vazio controlado;
- documentos operacionais iniciais e regras para agentes/contribuidores.

### Critérios de saída

- uma clonagem limpa conclui instalação, checks e build com comandos documentados;
- `dist/` é o único artefato implantável;
- não há adapter, framework cliente, backend ou dependência de plataforma;
- falhas de qualidade interrompem a CI;
- nenhuma decisão da Fase 0 foi silenciosamente alterada pelo scaffold.
- o pipeline inicial da arquitetura produz `dist/` sem instalar ou executar Pagefind.

### Adiado

Schemas completos, visual, componentes, Pagefind, deploy e conteúdo final.

## 4. Fase 2 — Modelo editorial

### Objetivo

Transformar [CONTENT_MODEL.md](./CONTENT_MODEL.md) em schemas, consultas e gates executáveis.

### Dependências

Fundação reproduzível.

### Entregáveis

- sete Content Collections e tipos inferidos;
- regras comuns de identidade, datas, SEO e estado;
- catálogo central de mídia e `MediaUse`;
- validação transversal de referências, slugs, direitos e edições;
- registro fechado e validação sintática de MDX;
- fixtures realistas para todos os estados e relações;
- consulta central de elegibilidade pública usada por rotas, RSS e sitemap, e preparada para a busca da Fase 7.

### Critérios de saída

- fixtures válidas passam;
- cada caso inválido obrigatório falha com mensagem acionável;
- `draft`, `review` e agendamento futuro não geram artefato público;
- agendamento vencido só aparece em um build posterior;
- RSS inclui `published` e agendamento vencido no instante do build, e exclui `draft`, `review`, agendamento futuro e `archived`;
- mídia não liberada impede qualquer uso público;
- exatamente uma edição pública e atual é exigida;
- nenhuma página precisa ler YAML/Markdown bruto fora da camada de conteúdo.

### Adiado

Composição visual definitiva e importação em massa do acervo.

## 5. Fase 3 — Sistema visual

### Objetivo

Definir uma linguagem visual própria antes de compor páginas finais.

### Dependências

Modelo editorial estabilizado e amostras representativas de texto/imagem.

### Entregáveis

- reset, tokens, tipografia, grid, regras editoriais, movimento, utilitários e impressão;
- escala responsiva e container queries;
- protótipos de hierarquia para desktop e mobile;
- matriz de contraste e comportamento sobre imagens;
- seleção tipográfica baseada em licença, português, itálicos, pesos, desempenho e Windows.

### Critérios de saída

- hierarquia funciona nos extremos de viewport acordados e com zoom de 200%;
- ordem de leitura permanece lógica sem CSS;
- fontes são auto-hospedadas e licenciadas;
- movimento respeita `prefers-reduced-motion`;
- regras de impressão preservam leitura e créditos;
- tokens cobrem componentes sem valores arbitrários recorrentes.

### Adiado

Animações de navegação e polimento fotográfico por página.

## 6. Fase 4 — Componentes editoriais

### Objetivo

Construir o vocabulário reutilizável que transforma contratos em narrativa.

### Dependências

Schemas e sistema visual aprovados.

### Entregáveis

- componentes de imagem responsiva, legenda, crédito e metadata;
- `LeadImage`, `FullBleed`, `Diptych`, `Triptych`, `ContactSheet`, `FilmStrip`, `TextColumn`, `PullQuote`, `MetadataBlock`, `Credits` e `RelatedWorks`;
- cards e elementos de navegação compartilhados;
- diálogo/lightbox apenas se demonstrar valor e degradar corretamente;
- testes isolados com diferentes proporções, textos e direitos.

### Critérios de saída

- cada componente aceita somente contratos documentados;
- `sizes`, carregamento e prioridade correspondem ao uso real;
- alt contextual, decoração, legenda e crédito possuem semântica distinta;
- teclado, foco, leitor de tela e ausência de JavaScript são verificados;
- nenhum componente MDX arbitrário pode ser introduzido pelo conteúdo;
- regressão visual cobre pelo menos uma composição estreita e uma larga por família.

### Adiado

Homepage e navegação animada.

## 7. Fase 5 — Páginas internas

### Objetivo

Validar o produto em documentos permanentes antes de construir a capa.

### Dependências

Componentes editoriais maduros.

### Entregáveis

- índices e páginas de Trabalhos e Caderno;
- índices e páginas de Coleções e Edições;
- Sobre, Contato, 404, sitemap e RSS;
- metadados, canonical, Open Graph e dados estruturados;
- navegação global e caminhos para conteúdos relacionados.

### Critérios de saída

- todas as rotas previstas, exceto homepage/arquivo/busca ainda adiados, funcionam por URL direta;
- status e direitos produzem exatamente a superfície pública documentada;
- páginas funcionam sem JavaScript;
- navegação por teclado, zoom, leitores de tela e mobile real passam pela matriz manual;
- RSS inclui `published` e agendamento vencido no instante do build, exclui `draft`, `review`, agendamento futuro e `archived`, e o sitemap não vaza conteúdo inelegível;
- links quebrados e metadados ausentes falham na verificação.

### Adiado

Curadoria da capa, filtros e Pagefind.

### Registro de conclusão da Fase 5C

A distribuição pública (5C-A) e o contrato de metadata social, dados estruturados e integridade do `dist/` (5C-B) estão implementados. O gate público exige `SITE_URL` válida e executa a auditoria consolidada após o build; a fundação não define imagem social institucional. A Fase 6 permanece condicionada à aprovação explícita deste fechamento.

## 8. Fase 6 — Homepage por edição

### Objetivo

Renderizar a capa sobre conteúdo, contratos e componentes já validados.

### Dependências

Páginas internas e collection `edicoes` funcionais.

### Entregáveis

- `/` derivado da única edição atual;
- blocos `hero`, `work-grid`, `notebook-list`, `collection-feature` e `text-callout`;
- `/edicoes` e `/edicoes/[numero]` coerentes com a capa;
- tratamentos editoriais responsivos e imagens sociais da edição.

### Critérios de saída

- mudar a edição atual não exige editar componentes;
- a ordem vem integralmente de `blocks`;
- edição futura ou inválida não pode virar homepage;
- edições publicadas não mudam composição sem corrigenda;
- homepage sem JavaScript preserva conteúdo, ordem e links;
- o mobile reinterpreta, sem apenas comprimir, a hierarquia editorial.

### Adiado

Transições entre capa e páginas.

## 9. Fase 7 — Arquivo e busca

### Objetivo

Tornar o conjunto explorável sem criar backend ou fontes paralelas.

### Dependências

Conjunto público e metadados consolidados.

### Entregáveis

- `/arquivo` nos modos visual, cronológico e editorial;
- filtros por estado explícito, ano, cidade, formato, contexto, tema e coleção;
- índices pré-renderizados de faceta para navegação sem JavaScript;
- URLs compartilháveis para modos e combinações de filtros;
- Pagefind obrigatório no pipeline pós-build a partir desta fase;
- `/busca` com interface própria e metadados tipados;
- rótulo e tratamento claros para resultados arquivados.

### Critérios de saída

- arquivo e facetas isoladas continuam navegáveis sem JavaScript;
- filtros não criam combinações indexáveis ilimitadas;
- Pagefind indexa apenas HTML elegível;
- busca encontra título, resumo, texto, legenda, pessoa creditada, lugar, tema e coleção quando presentes no HTML/indexação, sem criar rota ou faceta pública para pessoas;
- resultados arquivados são distinguíveis;
- falha na indexação interrompe o build;
- o pipeline final da arquitetura produz `dist/` somente depois da validação completa, do build Astro, da indexação Pagefind e dos testes finais do artefato;
- busca e filtros passam em navegadores-alvo e por teclado.

### Adiado

Busca remota, ranking personalizado, mapa e linha do tempo avançada.

## 10. Fase 8 — Polimento progressivo

### Objetivo

Adicionar continuidade e refinamento sem enfraquecer a MPA.

### Dependências

Todas as rotas e interações essenciais estabilizadas.

### Entregáveis

- View Transitions nativas entre documentos para casos aprovados;
- microinterações curtas;
- ajustes de corte, performance e estabilidade visual;
- ampliação da regressão visual;
- auditoria completa de acessibilidade e funcionamento sem JavaScript.

### Critérios de saída

- navegadores sem View Transitions recebem navegação convencional;
- voltar/avançar, foco e posição de leitura se comportam corretamente;
- `prefers-reduced-motion` remove movimento não essencial;
- nenhuma transição exige `ClientRouter`;
- metas de performance definidas com dados reais são atingidas;
- não há overflow, layout shift evitável ou bloqueio por script.

### Adiado

Qualquer interação que exija framework cliente.

## 11. Fase 9 — Publicação

### Objetivo

Escolher e integrar uma plataforma gerenciada sem alterar o artefato estático.

### Dependências

Artefato final aprovado e volume real de mídia/build conhecido.

### Entregáveis

- matriz comparativa de plataforma por preço, banda, previews, domínio, analytics, formulários, imagens, limites de build e rollback;
- plataforma escolhida e decisão registrada;
- deploy automático de branch principal e previews seguros;
- domínio, HTTPS, headers, cache e rollback;
- monitoramento mínimo de disponibilidade e falhas de build;
- decisão separada sobre analytics e formulário.

### Critérios de saída

- `npm ci` e o build canônico produzem o mesmo `dist/` local e na CI;
- produção não requer runtime Node;
- rollback foi exercitado;
- domínio, canonical, sitemap, RSS e imagens sociais usam URL final;
- headers não quebram imagens, fontes, busca ou transições;
- privacidade e coleta de dados correspondem apenas aos recursos realmente habilitados.

### Adiado

Self-hosting, CMS, contas, pagamentos e servidor próprio.

## 12. Matriz mínima de verificação

| Cenário | Schema/integridade | Build/rotas | E2E | Manual |
| --- | --- | --- | --- | --- |
| Slug duplicado | Falha | Não publica | — | — |
| Referência inexistente | Falha com caminho | Não publica | — | — |
| Duas edições atuais | Falha | Não publica | — | — |
| Mídia `pending` em item público | Falha com usos | Não publica | — | Revisão de direitos |
| Agendamento futuro | Passa como privado | Sem HTML/RSS/índice | Confirma 404/ausência | — |
| Agendamento vencido após novo build | Passa como público | Gera rota/RSS; índice a partir da Fase 7 | Confirma navegação | — |
| Arquivado | Passa | URL e busca, sem listas/RSS | Confirma filtros | Rótulo compreensível |
| Alt contextual | Passa | HTML correto | Axe/semântica | Leitor de tela |
| JavaScript desabilitado | — | HTML completo | Fluxos essenciais | Leitura e navegação |
| Movimento reduzido | — | CSS aplicável | Preferência simulada | Conforto visual |
| Edição publicada alterada | Falha sem corrigenda | Não publica | — | Revisão editorial |

## 13. Decisões futuras já delimitadas

Não são pendências desta fase:

- **Fontes definitivas:** decididas na Fase 3 pelos critérios do brief e da arquitetura.
- **Hospedagem:** decidida na Fase 9 com medidas reais de build e banda.
- **Analytics:** apenas após objetivo, base legal, privacidade e orçamento de desempenho.
- **Formulário:** apenas após plataforma, endpoint, antispam, privacidade e operação.
- **Mídia remota/Git LFS:** revisão quando derivados excederem 1 GB ou CI exceder 10 minutos.
- **Internacionalização:** habilitada somente quando houver traduções completas e revisadas.
- **Framework cliente:** apenas para estado comprovadamente complexo e por decisão registrada.
- **Agendamento automático:** apenas quando a operação exigir e a plataforma estiver escolhida.
