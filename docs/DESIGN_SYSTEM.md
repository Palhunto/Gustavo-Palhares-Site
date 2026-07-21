# Sistema visual

Status: implementação técnica da Fase 3; aprovação editorial pendente

Escopo: linguagem visual, tipografia, grid, fotografia, responsividade, movimento, impressão e acessibilidade

## 1. Conceito

O sistema apresenta Gustavo Palhares como autor de uma publicação pessoal independente. A linguagem combina a disciplina de um jornal cultural, a centralidade visual de uma revista de fotografia, a permanência de um arquivo e a clareza de uma presença profissional discreta.

A identidade depende de relações editoriais — hierarquia, ritmo, filetes, proporções, metadados e pausas — em vez de ornamentos, efeitos de aplicativo ou uma marca corporativa. O contato é acessível, mas não organiza a experiência.

## 2. Relação com as referências

A segunda referência é a direção principal. Dela foram aproveitados:

- assinatura pessoal serifada e cabeçalho contido;
- destaque dominante dividido entre fotografia e texto;
- hierarquia mais seletiva e maior espaço de pausa;
- distribuição assimétrica de Caderno, trabalhos e presença profissional;
- ações editoriais discretas.

Da primeira referência permanecem:

- densidade de publicação abaixo da abertura;
- filetes contínuos que relacionam módulos;
- variedade de caminhos e proporções;
- metadados e marcadores funcionais;
- sensação de arquivo vivo, sem imitar literalmente um impresso.

Foram rejeitados deliberadamente:

- conteúdo, fotografias, datas, cidades, números de edição, biografia, citação, contato, redes e seletor de idioma mostrados nas referências;
- reprodução pixel-perfect;
- texto permanente sobre fotografia;
- textura pesada de papel, filtro vintage ou ruído constante;
- cards arredondados, sombras, gradientes de landing page e CTAs dominantes;
- trilhos laterais indispensáveis à compreensão;
- aparência de portfólio minimalista sustentada apenas por espaço vazio e uma serif.

## 3. Paleta

| Papel | Token | Valor | Uso |
| --- | --- | --- | --- |
| Papel | `--color-paper` | `#f3f0e8` | fundo principal quente e neutro |
| Superfície | `--color-surface` | `#fbfaf6` | áreas funcionais e contraste discreto |
| Tinta | `--color-ink` | `#171713` | texto e controles principais |
| Texto secundário | `--color-text-secondary` | `#57544e` | legendas e metadados |
| Linha | `--color-line` | `#c7c1b5` | filetes estruturais sem função textual |
| Acento | `--color-accent` | `#762f2c` | pequenos sinais, links e marcadores |
| Foco | `--color-focus` | `#9a352f` | contorno de foco visível |
| Seleção | `--color-selection` | `#ddc9b9` | seleção de texto |

O acento mineral não ocupa grandes superfícies nem substitui hierarquia. Erro e sucesso existem apenas como tokens funcionais.

### Matriz de contraste

| Combinação | Razão aproximada | Aplicação |
| --- | ---: | --- |
| tinta / papel | 15,78:1 | texto principal |
| secundário / papel | 6,63:1 | metadata e legenda |
| acento / papel | 8,33:1 | links e marcadores |
| superfície / tinta | 17,21:1 | botão primário |
| foco / papel | 6,31:1 | indicador de foco |

As linhas não carregam informação sozinhas. Estados continuam compreensíveis por texto, forma ou posição.

## 4. Tipografia

### Famílias e licença

- **Newsreader Variable:** títulos, aberturas, leitura editorial, citações e itálico. Licença SIL Open Font License 1.1; cobertura Latin/Latin Extended adequada ao português; pesos de 200 a 800; itálico real e eixo de tamanho óptico.
- **IBM Plex Sans Variable:** navegação, labels, metadata, legendas, filtros e controles. Licença SIL Open Font License 1.1; cobertura Latin/Latin Extended adequada ao português; pesos de 100 a 700 e itálicos reais disponíveis.

As famílias são auto-hospedadas pelos pacotes exatos `@fontsource-variable/newsreader@5.3.0` e `@fontsource-variable/ibm-plex-sans@5.3.0`. Não existe chamada a Google Fonts ou outra CDN.

São carregados Newsreader normal e itálico variáveis e IBM Plex Sans normal variável. IBM Plex Sans itálico permanece disponível no pacote, mas não é carregado porque nenhum papel atual o exige. Os arquivos usam WOFF2, `font-display: swap` e divisão por intervalo Unicode; fallbacks métricos locais reduzem mudança de layout em Windows e em outros ambientes.

### Papéis e escala

| Papel | Família | Token |
| --- | --- | --- |
| Display | Newsreader | `--text-display` |
| Título de seção | Newsreader | `--text-section` |
| Título de projeto | Newsreader | `--text-project` |
| Título de texto | Newsreader | `--text-article` |
| Introdução | Newsreader | `--text-intro` |
| Corpo editorial | Newsreader | `--text-body` |
| Legenda | IBM Plex Sans | `--text-caption` |
| Metadata | IBM Plex Sans | `--text-meta` |
| Label | IBM Plex Sans | `--text-label` |
| Navegação | IBM Plex Sans | `--text-nav` |

Os tokens usam `clamp()` e não copiam tamanhos dos mockups. Display tem largura controlada, corpo editorial usa aproximadamente 55–72 caracteres, títulos usam `text-wrap: balance` e números usam algarismos tabulares. O corpo parte de 16 px; metadata parte de 12 px e mantém contraste AA.

## 5. Grid e composição

O sistema usa 4 colunas em mobile, 8 em tablet e 12 em desktop. `--gutter` e `--grid-gap` são fluidos; `--page-max`, `--width-editorial` e `--width-reading` controlam escala geral e leitura.

Padrões disponíveis:

- largura total e bleed controlado;
- largura editorial intermediária;
- largura de leitura;
- divisão principal 2/3 + 1/3;
- hero assimétrico 7/12 + 5/12;
- lista editorial;
- composições de trabalhos orientadas pelo container;
- rodapé modular.

O grid estabelece alinhamentos, mas não obriga todo conteúdo a começar e terminar nas mesmas colunas. Títulos podem atravessar mais colunas que o texto de apoio; metadata pode ocupar a margem; imagens, citações e blocos textuais podem receber deslocamentos controlados, sempre no fluxo normal e com ordem semântica preservada.

### Hierarquia de filetes e pausas

- **Estrutural:** linha de 1 px em `--color-line-strong` para separar grandes regiões, como cabeçalho, abertura, conjunto editorial e rodapé.
- **Secundário:** linha de 1 px em `--color-line` para relações locais, como itens contíguos de uma lista ou a divisão principal em desktop.
- **Ausência deliberada:** espaço, alinhamento, escala ou mudança de densidade distinguem módulos sem linha. É o padrão para trabalhos, a faixa autoral e grupos que já possuem contraste suficiente.

Não se combinam bordas superior, inferior e lateral por inércia. Uma nova linha precisa explicar uma relação que espaçamento e alinhamento não comunicam sozinhos.

### Arquivo, edição e ritmo

Marcadores como `GP—2026—0001`, `EDIÇÃO 01`, `ARQ. 001`, `01 / 06`, `CADERNO 01`, `REV. 01`, `BAURU — SP` e `JUL. 2026` formam uma gramática de permanência, catalogação, localização e revisão. Na exploração, todos são identificados visualmente como **amostra técnica** ou **dado provisório**; não constituem conteúdo real.

Esses marcadores aparecem junto da função que explicam — trilho da abertura, cabeçalho do trabalho, legenda, nota autoral ou rodapé — e não como decoração solta. O ritmo alterna abertura ampla, área tipográfica densa, pausa, sequência visual irregular, nota autoral e encerramento funcional. Seções não repetem automaticamente o mesmo padding, altura ou número de colunas.

## 6. Fotografia

A fotografia domina quando possui função narrativa. O layout não pressupõe uma proporção universal e oferece padrões para abertura, paisagem, retrato, quadrado, miniatura, sequência e imagem legendada.

Regras:

- sem overlay permanente, filtro global, sombra ou arredondamento automático;
- texto e controles ficam em superfície separada por padrão;
- `object-fit: cover` só atua dentro de um uso com proporção conhecida;
- cortes futuros devem respeitar o ponto focal do catálogo de mídia;
- legenda e crédito ficam próximos, porém semanticamente separados do texto alternativo;
- sequências preservam a ordem do documento antes da composição visual;
- impressão troca corte por contenção quando necessário para preservar a imagem.

### Formatos editoriais de trabalho

- **Formato A — abertura ampla:** imagem dominante, número de arquivo e data independentes, título e legenda curta abaixo ou ao lado.
- **Formato B — retrato vertical:** título antecede ou acompanha a imagem, com metadata autônoma e sem descrição longa.
- **Formato C — sequência:** duas imagens mantêm ordem explícita e recebem título e contexto em bloco separado; a leitura horizontal de desktop vira uma sequência vertical lógica no mobile.

Os formatos não recebem moldura, superfície ou padding de card. Diferença de proporção, peso, espaço negativo e deslocamento editorial organizam o conjunto.

A exploração usa exclusivamente o ativo técnico já existente. Nenhuma fotografia das referências integra o produto.

## 7. Responsividade

Mobile é uma recomposição. A ordem estreita é assinatura, navegação, fotografia de abertura, texto do destaque, lista editorial, trabalhos, bloco institucional, amostra tipográfica e CTA.

- **320–767 px:** quatro colunas conceituais, uma coluna de conteúdo, fotografia antes do texto, trilhos laterais removidos e filetes apenas entre seções.
- **768–1023 px:** oito colunas, listas com metadata separada, dois módulos fotográficos quando o container permitir.
- **1024 px ou mais:** doze colunas, abertura 7/5, divisão Caderno 4/12 e trabalhos 8/12, faixa inferior modular.
- **1440–1920 px:** largura máxima preserva densidade e evita expansão indefinida; o display continua limitado por caracteres.
- **Zoom de 200%:** o comportamento se aproxima da composição estreita; ordem, metadata e controles permanecem no fluxo.

Alvos interativos têm no mínimo 44 px de altura. O documento usa `overflow-x: clip` como contenção defensiva, mas os módulos devem caber sem depender desse corte.

Marcadores laterais passam para cima do conteúdo em telas estreitas, preservando número, edição e estado sem consumir uma coluna. Sequências horizontais tornam-se verticais na ordem do documento; divisores secundários podem desaparecer quando o espaço já separa os itens.

## 8. Movimento

A Fase 3 define apenas gramática:

- duração curta de 160 ms e média de 240 ms;
- easing editorial sem elasticidade;
- deslocamentos máximos próximos de 4–8 px;
- hover limitado a cor, linha e pequeno deslocamento;
- foco imediato e independente de hover;
- `prefers-reduced-motion: reduce` elimina transições perceptíveis e qualquer rolagem suave.

Não há JavaScript, View Transitions, parallax, animação contínua ou entrada automática de seções.

## 9. Acessibilidade

- HTML e ordem de foco seguem a ordem de leitura, independentemente do grid.
- Há link de salto e landmarks identificáveis.
- Links continuam sublinhados ou possuem forma explícita; cor não é o único sinal.
- Foco usa contorno de 2 px com afastamento.
- Texto não aparece sobre fotografia no padrão demonstrado.
- Imagens técnicas possuem texto alternativo contextual; legenda e crédito permanecem separados.
- A grade de inspeção é opcional, controlável por teclado e não altera conteúdo.
- A página funciona sem JavaScript e não depende de hover.

## 10. Impressão

Na impressão, navegação, controles técnicos e botões são removidos. Papel vira branco, tinta vira preta, URLs externas úteis podem ser expandidas e figuras, legendas, citações e módulos evitam quebras internas. Imagens usam contenção para não perder informação.

A saída impressa preserva título, autoria, metadata, crédito, legenda e ordem de leitura; não tenta reproduzir a tela como fac-símile.

## 11. Regras para futuros componentes

1. Componentes recebem contratos validados e nunca leem caminhos brutos de conteúdo.
2. Novas variantes devem reutilizar tokens sem introduzir valores recorrentes isolados.
3. Ordem semântica é definida antes da composição responsiva.
4. Imagem só domina quando há função narrativa identificável.
5. CTA não compete com o conteúdo editorial.
6. Tratamentos não recebem nomes de classes CSS no conteúdo.
7. Interação essencial funciona por link, controle nativo e HTML completo.
8. Um novo padrão precisa funcionar em 320 px, 200% de zoom, teclado, movimento reduzido e impressão.

### Links e botões

- **Link editorial:** navega entre conteúdos; usa texto, seta e regra curta, com baixa massa visual.
- **Botão secundário:** aciona interface; usa borda simples, fundo neutro e foco explícito.
- **Botão primário:** fica reservado a uma ação profissional ou funcional importante e não se repete como navegação comum.

Hero, Caderno e Trabalhos usam link editorial. Contato pode usar botão primário compacto. Controles técnicos podem manter forma própria quando seu estado precisa permanecer evidente.

## 12. Critérios contra aparência genérica

O sistema deve apresentar simultaneamente:

- uma assinatura autoral reconhecível;
- um destaque principal perceptível em até três segundos;
- ao menos três caminhos secundários distintos;
- mistura intencional entre texto, imagem e metadata;
- hierarquia de filetes, pausas e alinhamentos editoriais;
- proporções fotográficas variadas;
- pausas que não esvaziem a densidade;
- ações pontuais, sem coleção de botões equivalentes.

Se a composição puder ser descrita apenas como “serif grande, muito branco e cards de portfólio”, ela falhou e deve ser revista.

## 13. Exploração técnica

A rota `/exploracoes/sistema-visual` demonstra o sistema sem antecipar uma página final. Ela possui `noindex`, não entra na navegação principal, não contém fatos pessoais não confirmados e funciona sem JavaScript. O controle “Exibir grid” serve somente à inspeção técnica.
