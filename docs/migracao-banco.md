# Mudar de banco (ou de região)

Motivo comum: o Supabase estava na AWS `us-east-1`, com ~130 ms por consulta e ~1 s para abrir uma conexão nova, o que pesa
sempre que o cache do site esfria. O banco atual fica em `sa-east-1` (São Paulo), junto das funções da Vercel (`vercel.json`).
Se o banco mudar de região de novo, mude também `regions` no `vercel.json`.

## Passo a passo

1. **Backup do banco atual** (`npm run backup`, docs/backup-banco.md). Ele é o ponto de volta se algo der errado.
2. **Criar o projeto novo** no Supabase, na região desejada. Anote a senha do banco.
3. **Restaurar a cópia** no projeto novo (docs/backup-banco.md, seção "Restaurar") e rodar `db/seguranca-rls.sql`.
4. **Conferir:** `SELECT count(*)` das tabelas principais no banco novo contra o antigo (`imoveis`, `fotos`, `administradores`).
5. **Trocar a `DATABASE_URL`** na Vercel (Production, Preview e Development) pela string do *Transaction pooler* do projeto novo
   e fazer um novo deploy. No `.env.local`, qualquer uma das duas conexões serve.
6. **Invalidar o cache** (`POST /api/revalidar`) ou aguardar o deploy.
7. Manter o banco antigo por alguns dias, só como reserva, e depois pausá-lo ou apagá-lo.

## Cuidados

- Enquanto a `DATABASE_URL` não for trocada, as edições do painel vão para o banco antigo. Evite editar entre a restauração
  e a troca, ou refaça o backup e a restauração (`--clean --if-exists`) logo antes de trocar.
- As fotos ficam no S3 e não são afetadas por esta mudança.
