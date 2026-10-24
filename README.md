# A3 Soluções Imobiliárias — site

Site em **Next.js 16 (App Router)**. O catálogo fica no **PostgreSQL** (Supabase) e é mantido pelo painel `/admin`; as fotos
ficam no **S3**. Não há integração com nenhum sistema externo: os contatos feitos pelos formulários viram uma mensagem pronta
no WhatsApp da A3.

## Rodando

Requer Node.js 20.9+ (recomendado: 24 LTS).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # produção
npm run lint
npm run backup     # cópia do banco em ~/backups/website-A3 (docs/backup-banco.md)
```

Copie `.env.example` para `.env.local` e preencha (principalmente `DATABASE_URL`). Em produção, `NEXT_PUBLIC_SITE_URL` precisa
ser o endereço real do site: ele alimenta canonical, Open Graph, sitemap e JSON-LD (docs/deploy-vercel.md).

## Páginas

| Rota | Conteúdo | Renderização |
| --- | --- | --- |
| `/` | Home | Estática (regenera a cada 1h ou via webhook) |
| `/imoveis/[categoria]/[tipo]/[cidade]/[bairro]` | Busca. Todos os segmentos são opcionais: `/imoveis`, `/imoveis/venda`, `/imoveis/lancamentos/paulista/jaguaribe`, `/imoveis/apartamentos/recife`… | Shell estático + resultados por streaming (PPR) |
| `/imovel/[slug]` | Detalhe do imóvel/empreendimento | Estática |
| `/minha-casa-minha-vida`, `/minha-casa-minha-vida/[cidade]` | Imóveis do programa, no geral e por cidade | Estática |
| `/politica-de-privacidade` | Texto-base LGPD (**revisar com o jurídico**) | Estática |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | SEO técnico | Gerados |
| `/api/imoveis` | JSON do "Carregar mais" (celular) | Dinâmica |
| `/api/revalidar` | Webhook (protegido por `REVALIDATE_SECRET`) para invalidar o cache | Dinâmica |
| `/admin` | Painel administrativo (login, imóveis, vitrine da home) | Dinâmica, `noindex` |

Filtros que não viram página (quartos, vagas, área, ordem, página…) vão na query string
(`?quartos=2&ordem=menor-preco`) e apontam o `canonical` para a página limpa.

## SEO — o que já está feito

Detalhes, como conferir e o que depende de fora do código: **docs/seo.md**.

- **Uma página principal por conjunto de imóveis**: as URLs de busca que mostram exatamente os mesmos imóveis apontam o
  `canonical` para a mais específica, e as que têm um imóvel só ficam fora do Google. O sitemap lista só as principais.
- **Títulos e descrições** com palavra-chave + local + UF (a UF vem da cidade) e números do próprio catálogo.
- **404 real** para URLs inexistentes (`src/proxy.ts`), em vez de "soft 404".
- **Dados estruturados (JSON-LD)**: `RealEstateAgent` + `WebSite` (todas as páginas), `BreadcrumbList`, `CollectionPage`,
  `ItemList` e `RealEstateListing` com `Offer`.
- Texto e links internos em cada busca, seção de cidades na home, página do Minha Casa Minha Vida por cidade.
- Open Graph/Twitter com a foto do imóvel; imagem padrão gerada para as demais páginas.
- HTML semântico, `lang="pt-BR"`, trilha de navegação, texto alternativo descritivo nas fotos, nome/endereço/telefone (SEO
  local) no rodapé.

## Performance

- Home e páginas de imóvel são **100% estáticas** (`ensureStatic = 'navigation'`).
- Busca: shell estático entregue na hora + resultados por streaming; cada troca de filtro atualiza a URL e o servidor responde
  só o trecho que mudou (UI otimista, sem recarregar).
- `next/image` com `sizes` por layout e o tamanho certo de foto (400/800/1600) escolhido por um loader próprio; a foto
  principal carrega com prioridade alta e o endereço das fotos é pré-conectado.
- Desktop e celular usam **o mesmo HTML** (só CSS muda), então nada é baixado em dobro.
- Fonte Archivo auto-hospedada (`next/font`), só o subconjunto latino, com o eixo de largura.
- Mapas são prévias estáticas com link para o Google Maps (o iframe do Google custaria ~500 KB de JS por visita).
- JavaScript no navegador só onde há interação: menu, filtros, galeria, plantas, formulários.

## Dados e cache

O catálogo vive só no banco de dados (PostgreSQL/Supabase). Os imóveis foram importados uma vez de um export do sistema
anterior (Supremo) e, daí em diante, são mantidos pelo painel `/admin`. Todas as leituras passam por
`src/lib/imoveis/consultas.ts` (SQL), envolvidas com `"use cache"` em `src/lib/imoveis/repositorio.ts`.

- Cada gravação feita pelo painel invalida o cache, e o site se atualiza na hora.
- `POST /api/revalidar` com `Authorization: Bearer <REVALIDATE_SECRET>` invalida o cache à mão (por exemplo, depois
  de mexer direto no banco).
- Sem isso, o cache do catálogo expira sozinho a cada hora.
- Fotos de fora do site precisam ter o host liberado em `src/lib/imoveis/hosts-fotos.ts` (usado por `next.config.ts`).

## Formulários e contatos

Os formulários (contato, agendar visita, falar com corretor) usam Server Actions (`src/app/acoes.ts`): validam no
servidor, têm campo-armadilha anti-robô e funcionam até sem JavaScript. **Nada é gravado nem registrado em log:** a ação
devolve o link do WhatsApp da A3 com a mensagem pronta (nome, WhatsApp, interesse, dias e horários) e o navegador abre a
conversa; a tela de sucesso traz um botão de reserva. O contato só chega à A3 quando a pessoa envia a mensagem no WhatsApp.
A política de privacidade descreve isso; se um dia os contatos passarem a ser gravados, atualize o texto.

## Painel administrativo (`/admin`)

Permite à equipe cadastrar e editar imóveis, desativá-los (somem do site, continuam no painel), excluí-los (apaga de vez, com
as fotos do S3) e escolher o imóvel do topo da home e os destaques.

**Primeiro acesso:** não existe administrador padrão. Cadastre cada administrador com o `INSERT` do
`docs/login-admin.md`.

**Catálogo no banco (PostgreSQL/Supabase, `DATABASE_URL`):**

- **Login**: os admins ficam na tabela `administradores` (senha em bcrypt, conferida no banco). A sessão é um
  token aleatório num cookie `httpOnly`; a tabela `sessoes_admin` guarda só o hash dele. Vale por 8 h e é
  encerrada ao fechar o navegador; com "Manter conectado", 30 dias. Desativar o administrador ou apagar a linha da
  sessão derruba o acesso na hora. O limite de tentativas (8 por IP, 20 por e-mail, a cada 15 min) fica na tabela
  `tentativas_login`. Detalhes em `docs/login-admin.md`.
- **Alterações**: gravadas direto nas tabelas do catálogo (`db/schema.sql`), com registro em `auditoria`.
- **Fotos enviadas pelo painel**: vão para o S3 (JPG, PNG ou WebP, até 15 MB, formato conferido pelo conteúdo do arquivo;
  na Vercel o limite é 4,5 MB), em quatro versões (original + 400/800/1600). O envio usa a rota `POST /admin/enviar-foto`,
  que exige a sessão do painel. Detalhes em `docs/fotos-s3.md`.

## Banco, backup e infraestrutura

| Assunto | Onde |
| --- | --- |
| Estrutura do banco e segurança (RLS) | `db/schema.sql`, `db/seguranca-rls.sql` |
| Backup e restauração do banco | `docs/backup-banco.md` (`npm run backup`) |
| Mudar de banco ou de região | `docs/migracao-banco.md` |
| Deploy na Vercel (variáveis, domínio, região) | `docs/deploy-vercel.md` |
| Fotos no S3 e usuário IAM do site | `docs/fotos-s3.md` |
| CloudFront na frente do bucket | `docs/cloudfront.md` |
| Login do painel | `docs/login-admin.md` |
| Busca paginada no banco | `docs/busca-paginada.md` |
| SEO | `docs/seo.md` |

## Pendências antes de ir ao ar

- Registrar o domínio, apontá-lo para a Vercel e definir `NEXT_PUBLIC_SITE_URL`; depois, Search Console e Perfil da Empresa
  no Google (docs/seo.md).
- Na Vercel: `DATABASE_URL` do pooler, `REVALIDATE_SECRET` aleatório e a chave do usuário IAM mínimo (docs/deploy-vercel.md).
- Rodar `db/seguranca-rls.sql` no Supabase e cadastrar o administrador.
- Revisar a política de privacidade com o jurídico.
- Corrigir os cadastros que prejudicam o site (preço, quartos e tipo errados, anúncios repetidos: lista em docs/seo.md).
- Endereço completo e coordenadas dos empreendimentos e nome da construtora, onde faltarem (os campos já existem no
  modelo: `local.logradouro`, `local.geo`, `construtora`).
- Trocar o endereço das fotos pelo do CloudFront e fechar o bucket (docs/cloudfront.md).
- Analytics (ex.: Vercel Analytics ou GA4), com atualização da política de privacidade, e medição de Core Web Vitals em produção.

## Estrutura

```
db/                       estrutura do banco, segurança (RLS) e migrações
docs/                     deploy, banco, fotos, CloudFront, login, SEO
scripts/                  backup do banco
src/
  app/                    rotas, metadados, sitemap, robots, Server Actions
  components/
    admin/                painel: lista, formulário do imóvel, vitrine
    busca/                filtros, barra de busca, resultados, paginação, texto e links de cada busca
    home/                 busca do hero e seção de cidades
    imovel/               galeria, plantas, lazer, abas de contato
    imoveis/CardImovel    card usado em home, busca e semelhantes
    layout/               cabeçalho, menu mobile, rodapé, botão do WhatsApp
    formularios/          formulário da home e partes compartilhadas
    mcmv/                 páginas do Minha Casa Minha Vida
    ui/, seo/             ícones, migalhas, mapa, JSON-LD
  lib/
    admin/                login, sessão, fotos (S3)
    db/                   conexão com o Postgres
    imoveis/              tipos, filtros ⇄ URL, consultas SQL, páginas de busca e canonical, textos de SEO, cache
    seo.ts, site.ts       dados estruturados; dados da imobiliária (telefone, endereço, CRECI…)
  proxy.ts                404 para URLs de busca inexistentes e porta de entrada do painel
vercel.json               região das funções (São Paulo)
```
