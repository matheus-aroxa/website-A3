# Deploy na Vercel

## Antes do primeiro deploy

1. **Domínio.** Registre o domínio (para `.com.br`, no registro.br) e adicione na Vercel em Settings > Domains: o `www` e o
   endereço sem `www`, um redirecionando para o outro. Configure no DNS os registros que a Vercel mostrar. Em 24/10/2026 o
   endereço padrão do código, `www.a3solucoesimobiliarias.com.br`, **não existia no DNS** (NXDOMAIN): se for esse o nome
   escolhido, falta registrá-lo e apontá-lo.
2. **`NEXT_PUBLIC_SITE_URL`** com o endereço final (veja abaixo). Faça este passo depois do 1.
3. **Banco:** rode `db/seguranca-rls.sql` no SQL Editor do Supabase (fecha o acesso pela API pública do Supabase; o site não é
   afetado). Faça `npm run backup` antes (docs/backup-banco.md).
4. **AWS:** crie o usuário IAM do site, só com as permissões mínimas (docs/fotos-s3.md), e use a chave dele na Vercel. Nunca a do
   administrador.
5. **Administrador do painel:** não existe padrão; cadastre pelo SQL Editor (docs/login-admin.md) com uma senha longa.

## Variáveis de ambiente (Project Settings > Environment Variables)

| Variável | Valor |
|---|---|
| `DATABASE_URL` | **Transaction pooler** do Supabase: `postgresql://postgres.<projeto>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres` |
| `NEXT_PUBLIC_SITE_URL` | **Obrigatória.** O endereço público com `https://` e sem barra no fim, por exemplo `https://www.seudominio.com.br`. Alimenta o `canonical`, o sitemap, o `robots.txt`, o Open Graph e os dados estruturados |
| `REVALIDATE_SECRET` | Segredo da rota `POST /api/revalidar`. Gere um valor aleatório: `openssl rand -hex 32` |
| `GOOGLE_SITE_VERIFICATION` | Opcional: código de verificação do Search Console |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Chave do usuário IAM do site (`s3:PutObject`/`DeleteObject` em `imoveis/*` e `empreendimentos/*`, `s3:ListBucket`): docs/fotos-s3.md |
| `AWS_REGION` | `sa-east-1` |

Marque a `DATABASE_URL` para **Production, Preview e Development**: o build também consulta o banco (gera as páginas).

**Por que a `NEXT_PUBLIC_SITE_URL` importa.** O Google trata esse endereço como o "oficial" de cada página. Se ele apontar para um
domínio que não existe, ou for diferente de onde o site está, as páginas não são indexadas direito. A variável é lida na hora de
gerar as páginas: depois de mudar, faça um novo deploy. Os deploys de preview ficam fora do Google (a Vercel os marca com
`noindex`).

## Região das funções

O `vercel.json` fixa as funções em `gru1` (São Paulo), a mesma região do banco (`sa-east-1`). Sem isso a Vercel usa Washington e
cada consulta ao banco ganha ~100 ms de ida e volta. Se o banco mudar de região, mude `regions` junto (docs/migracao-banco.md).

## Por que o pooler

O endereço direto do Supabase (`db.<projeto>.supabase.co`) só tem IPv6, e a Vercel (build e funções) só sai por IPv4:
a conexão falha com `ENOTFOUND` ou `ENETUNREACH`, mesmo com a variável certa. O host do pooler do projeto aparece em
Supabase > Connect; o prefixo muda de projeto para projeto (`aws-0-` ou `aws-1-`). Se o usuário/host estiverem errados o
pooler responde `tenant/user ... not found`. A aplicação se recusa a subir na Vercel com a conexão direta e diz o motivo
no log (`src/lib/db/index.ts`).

## Depois do deploy

- Abra `/`, `/imoveis`, um anúncio, `/minha-casa-minha-vida`, `/sitemap.xml` e `/robots.txt` (a linha `Sitemap:` tem que mostrar o
  domínio certo) e `/admin/entrar`.
- Entre no painel, envie uma foto de teste (até 4,5 MB, veja abaixo) e exclua o imóvel de teste depois.
- Search Console, Perfil da Empresa no Google e o resto do que depende de fora do código: docs/seo.md.

## Conferido localmente

`next build` de produção (Next 16.4.2): 982 páginas. As 459 URLs do sitemap foram auditadas (canonical, título, descrição, H1,
Open Graph, JSON-LD), os formulários foram preenchidos e enviados num navegador de verdade, e o site e o painel foram testados
contra uma cópia restaurada do backup com o RLS ligado. Numa verificação anterior, com `VERCEL=1` e o pooler (porta 6543), foram
conferidos site, busca, API, login e sessão do painel.

## Limitações conhecidas em produção

- **Fotos enviadas pelo painel** vão para o S3 (`docs/fotos-s3.md`), então o disco somente leitura não atrapalha. Resta o
  limite de 4,5 MB por requisição da Vercel (o painel aceita 15 MB): fotos maiores falham no envio e o formulário avisa. A
  saída é enviar direto do navegador ao S3 com URL pré-assinada (exige CORS no bucket).
- Não há administrador padrão: cadastre um em `administradores` (veja `docs/login-admin.md`).
- Os contatos dos formulários não são gravados: viram uma mensagem pronta no WhatsApp da A3 (veja o README).
