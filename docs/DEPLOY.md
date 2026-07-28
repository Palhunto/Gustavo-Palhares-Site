# Deploy de produção

## Contrato canônico

A URL canônica aprovada é:

```text
https://gustavopalhares.com.br
```

O domínio sem `www` é a única origem do site. O código não mantém uma cópia
fixa desse endereço em componentes ou páginas: `SITE_URL` é lida e normalizada
por `src/lib/seo/site-url.ts`, e dessa base derivam `astro.config.mjs`,
canonical, `og:url`, imagens sociais, JSON-LD, sitemap, RSS e robots.

Sem `SITE_URL`, desenvolvimento, testes técnicos e `npm run build` continuam
funcionando localmente. Nesse modo, metadados que exigem origem absoluta não são
inventados. Um build destinado à publicação deve sempre informar a variável e
passar pelo gate público.

## Cloudflare Pages

Configuração do projeto:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js | `24.16.0` |
| Variável de produção | `SITE_URL=https://gustavopalhares.com.br` |

Defina também `NODE_VERSION=24.16.0` nas variáveis de build da Cloudflare. O
mesmo valor está fixado em `.nvmrc`.

O artefato permanece Astro estático. Não adicionar Wrangler, adapter SSR,
Worker ou Pages Functions. O endereço técnico `pages.dev` não deve ser usado
como canonical e não deve ser fixado no repositório.

Antes de publicar, execute localmente:

```powershell
$env:SITE_URL = "https://gustavopalhares.com.br"
npm.cmd run validate:public
npm.cmd run check:public-integrity
```

## Redirecionamento de `www`

Adicione `www.gustavopalhares.com.br` como domínio personalizado e crie uma
regra de redirecionamento permanente na zona:

- condição: `http.host eq "www.gustavopalhares.com.br"`;
- destino dinâmico:
  `concat("https://gustavopalhares.com.br", http.request.uri.path)`;
- código: `301`;
- preservar query string: ativado.

Assim, por exemplo,
`https://www.gustavopalhares.com.br/trabalhos/?origem=www` redireciona para
`https://gustavopalhares.com.br/trabalhos/?origem=www`. A variante `www` não
deve servir HTML próprio, evitando conteúdo duplicado.

## DNS e verificação

Depois que os dois domínios personalizados estiverem ativos:

1. confirme que o apex responde em HTTPS;
2. confirme que `www` responde somente com `301`, preservando caminho e query;
3. inspecione canonical e `og:url` em uma página institucional e nos quatro
   trabalhos;
4. confirme
   `https://gustavopalhares.com.br/sitemap.xml` e
   `https://gustavopalhares.com.br/robots.txt`;
5. não promova o deploy se qualquer URL pública apontar para host local,
   endereço privado, domínio reservado ou `pages.dev`.
