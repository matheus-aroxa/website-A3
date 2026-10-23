# Deploy na Vercel

## Variáveis de ambiente (Project Settings > Environment Variables)
| Variável | Valor |
|---|---|
| `DATABASE_URL` | **Transaction pooler** do Supabase: `postgresql://postgres.<projeto>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres` |
| `NEXT_PUBLIC_SITE_URL` | O endereço público do site, sem barra no fim (canonical, sitemap, Open Graph) |
| `REVALIDATE_SECRET` | Segredo do webhook `POST /api/revalidar` |
| `GOOGLE_SITE_VERIFICATION` | Opcional |

Marque a `DATABASE_URL` para **Production, Preview e Development**: o build também consulta o banco (gera as páginas).

## Por que o pooler
O endereço direto do Supabase (`db.<projeto>.supabase.co`) só tem IPv6, e a Vercel (build e funções) só sai por IPv4:
a conexão falha com `ENOTFOUND` ou `ENETUNREACH`, mesmo com a variável certa. O host do pooler do projeto aparece em
Supabase > Connect; o prefixo muda de projeto para projeto (`aws-0-` ou `aws-1-`). Se o usuário/host estiverem errados o
pooler responde `tenant/user ... not found`. A aplicação se recusa a subir na Vercel com a conexão direta e diz o motivo
no log (`src/lib/db/index.ts`).

## Conferido localmente
`VERCEL=1` + pooler (porta 6543): build de produção com 973 páginas, site, busca, API, login e sessão do painel.

## Limitações conhecidas em produção
- **Fotos enviadas pelo painel** são gravadas no disco (`ADMIN_DADOS_DIR`), que na Vercel é somente leitura, e a Vercel
  limita o corpo de uma requisição a 4,5 MB (o painel aceita 15 MB). Em produção o envio de fotos precisa ir para o S3.
- Não há administrador padrão: cadastre um em `administradores` (veja `docs/login-admin.md`).
