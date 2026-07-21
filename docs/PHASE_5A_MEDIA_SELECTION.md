# Seleção de mídia — Fase 5A

## Escopo e processamento

A pasta `seleção fase 5/` contém 17 JPEGs: oito em `Show/` e nove em `Rua/`. Todos foram decodificados integralmente; não há RAW, TIFF, PSD, arquivo incompatível ou corrompido. Os originais medem entre 4,3 e 13,8 MB e chegam a 5568 px no lado maior. Eles permanecem intocados e fora do Git.

Uma comparação visual e perceptual encontrou seis imagens já catalogadas na Fase 4. Esses ativos reutilizam seus IDs existentes. Para as outras 11 imagens foram gerados derivados JPEG sRGB de até 2560 px, sem EXIF incorporado, totalizando aproximadamente 3 MB antes das variantes produzidas pelo Astro.

Como o loader de imagens da collection `midia` copia qualquer ativo referenciado para o build mesmo sem rota, os 11 registros pendentes ficam no manifesto privado `docs/phase-5a/media-pendente.yaml`, fora das collections carregadas em produção. Os derivados permanecem canônicos em `src/assets/media/`, mas só poderão migrar para `src/content/midia/` após clearance público. O script `check:private-media` interrompe o build se um arquivo `fase-5-*` chegar a `dist/`.

## Inventário e mapeamento

| Origem | Dimensões | Orientação/proporção | ID editorial | Função provisória | Condição |
| --- | ---: | --- | --- | --- | --- |
| `Show/show-01-abertura.jpg` | 4657 × 3712 | horizontal, 1,25:1 | `fase-5-show-01-abertura` | abertura | nova; direitos `pending` |
| `Show/show-02-ambiente.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-show-02-ambiente` | contexto e mediação por tela | nova; direitos `pending` |
| `Show/show-03-silhueta.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-show-03-silhueta` | luz e gesto | nova; direitos `pending` |
| `Show/show-04-guitarrista-vertical.jpg` | 3712 × 5568 | vertical, 2:3 | `fase-4-palco-02` | contraponto vertical | reutiliza ativo da Fase 4 |
| `Show/show-05-vocalista-fumaca.jpg` | 3937 × 3712 | quase quadrada, 1,06:1 | `fase-4-palco-03` | aproximação | reutiliza ativo da Fase 4 |
| `Show/show-06-publico.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-4-palco-04` | relação entre palco e público | reutiliza ativo da Fase 4 |
| `Show/show-07-confronto.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-show-07-confronto` | proximidade e ação | nova; direitos `pending` |
| `Show/show-08-encerramento.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-show-08-encerramento` | encerramento | nova; direitos `pending` |
| `Rua/rua-01-abertura.jpg` | 5483 × 3655 | horizontal, 3:2 | `fase-4-mercado-01` | abertura | reutiliza ativo da Fase 4 |
| `Rua/rua-02-plano-geral.jpg` | 5553 × 3702 | horizontal, 3:2 | `fase-5-rua-02-plano-geral` | circulação e contexto | nova; direitos `pending` |
| `Rua/rua-03-personagem.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-rua-03-personagem` | aproximação | nova; direitos `pending` |
| `Rua/rua-04-gesto.jpg.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-4-mercado-02` | ação na sequência | reutiliza ativo da Fase 4 |
| `Rua/rua-05-relacao.jpg` | 5249 × 2953 | horizontal, 16:9 | `fase-5-rua-05-relacao` | relação entre pessoas | nova; direitos `pending` |
| `Rua/rua-06-detalhe.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-rua-06-detalhe` | detalhe | nova; direitos `pending` |
| `Rua/rua-07-espaco.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-rua-07-espaco` | espaço e plano geral | nova; direitos `pending` |
| `Rua/rua-08-sequencia.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-5-rua-08-sequencia` | continuidade | nova; direitos `pending` |
| `Rua/rua-09-encerramento.jpg` | 5568 × 3712 | horizontal, 3:2 | `fase-4-retrato-amplo` | encerramento e retrato próximo | reutiliza ativo da Fase 4 |

## Ordens confirmadas e clearance

- **Nephillin — Uma cobertura sem credencial:** `fase-5-show-01-abertura`, `fase-5-show-02-ambiente`, `fase-5-show-03-silhueta`, `fase-4-palco-02`, `fase-4-palco-03`, `fase-4-palco-04`, `fase-5-show-07-confronto`, `fase-5-show-08-encerramento`.
- **Feira do Rolo:** `fase-4-mercado-01`, `fase-5-rua-02-plano-geral`, `fase-5-rua-03-personagem`, `fase-4-mercado-02`, `fase-5-rua-05-relacao`, `fase-5-rua-06-detalhe`, `fase-5-rua-07-espaco`, `fase-5-rua-08-sequencia`, `fase-4-retrato-amplo`.

As duas ordens seguem a numeração dos arquivos originais. O autor autorizou ambos os trabalhos para publicação pública no site, sem legendas individuais. Essa autorização não registra autorização nominal das pessoas retratadas. Os trabalhos continuam privados, e suas rotas só poderão ser ativadas na Fase 5B.

## Limites editoriais

As funções da tabela descrevem somente o papel provisório de cada quadro na montagem. Títulos, resumos, datas, cidade, assunto, formato, contexto, ordem, crédito e clearance editorial dos dois trabalhos foram confirmados. Nomes das pessoas, local exato, horário, organização, contexto histórico e legendas individuais não foram registrados. Os 11 novos ativos permanecem no catálogo técnico privado até a ativação editorial da Fase 5B; nenhuma mídia ou rota é publicada nesta operação.
