# Backup e restauração do banco

O catálogo, os administradores e o histórico do painel ficam no PostgreSQL do Supabase (schema `public`, 15 tabelas). O
Supabase só faz backup automático em alguns planos (confira em Project Settings > Database > Backups), então vale ter uma
cópia própria, guardada fora do repositório.

## Fazer um backup

```bash
npm run backup                        # grava em ~/backups/website-A3
bash scripts/backup-banco.sh /outra/pasta
```

Precisa de Docker (usa o `pg_dump` 17 da imagem do Supabase, igual ao servidor) e de `DATABASE_URL` no `.env.local`. O pooler
em modo *transaction* (porta 6543, o que a Vercel usa) não serve para `pg_dump`: use a conexão direta (`db.<projeto>.supabase.co:5432`)
ou o pooler em modo *session* (porta 5432). Sem Docker, instale o cliente (`sudo apt install postgresql-client`) e rode o
`pg_dump` do script à mão.

Cada execução grava três arquivos, com a data no nome, e atualiza o `SHA256SUMS.txt`:

| Arquivo | Para quê |
|---|---|
| `a3-banco_<data>.dump` | Cópia completa (formato custom do `pg_dump`, comprimido). É a que se restaura com `pg_restore` |
| `a3-banco_<data>.sql` | A mesma cópia em SQL puro, legível; restaura com `psql` |
| `a3-schema_<data>.sql` | Só a estrutura, sem dados |

Os arquivos têm o hash da senha dos administradores e o histórico do painel: ficam com permissão 600, o `.gitignore` os barra
e não devem ir para nuvem sem criptografia. Os dumps usam `--no-owner --no-acl`, então restauram em qualquer projeto do
Supabase sem depender de quem era o dono.

**Backup de 24/10/2026** (`~/backups/website-A3/a3-banco_2026-10-24_1803.*`): restaurado num Postgres 17 descartável e comparado
com a produção tabela a tabela (contagem de linhas e hash do conteúdo), mais as sequências: as 15 tabelas e as sequências
ficaram idênticas.

## Restaurar

Escolha o destino: um projeto novo do Supabase (o caso de mudar de banco ou de região) ou o mesmo projeto, se for preciso
voltar atrás. Com a imagem do Supabase (não precisa instalar nada):

```bash
IMG=public.ecr.aws/supabase/postgres:17.6.1.156
docker run --rm --network host -v ~/backups/website-A3:/backup --entrypoint pg_restore $IMG \
  --no-owner --no-acl --dbname "postgresql://postgres:<senha>@db.<projeto>.supabase.co:5432/postgres" /backup/a3-banco_<data>.dump
```

1. O aviso `schema "public" already exists` é esperado (o Supabase já cria esse schema) e pode ser ignorado.
2. **Rode `db/seguranca-rls.sql`** no destino: a cópia nasce com as permissões padrão do Supabase, abertas para quem tiver a
   chave pública (veja o cabeçalho do arquivo).
3. Para **sobrescrever** um banco que já tem dados, acrescente `--clean --if-exists` ao `pg_restore`: ele apaga as tabelas do
   site antes de recriá-las. Só faça isso no banco que você quer mesmo substituir.
4. Troque a `DATABASE_URL` da Vercel pela do pooler do banco novo (docs/deploy-vercel.md) e invalide o cache
   (`POST /api/revalidar`) ou faça um novo deploy.
5. As sessões do painel voltam junto com a cópia. Para derrubar todas: `DELETE FROM sessoes_admin;`.

Só uma tabela (por exemplo, `imoveis` apagada por engano): `pg_restore --data-only --table=imoveis ...` num banco que já tem a
estrutura; confira antes com `pg_restore --list` o que o arquivo contém.

Para ver o conteúdo sem restaurar: `docker run --rm -v ~/backups/website-A3:/backup --entrypoint pg_restore $IMG --list /backup/a3-banco_<data>.dump`.

## Montar um banco do zero

`db/schema.sql` cria as tabelas, os tipos e o gatilho (sem dados) e já traz a linha única de `vitrine_config`. Rode-o no SQL
Editor do Supabase, depois `db/seguranca-rls.sql` e cadastre um administrador (docs/login-admin.md). O catálogo vem do backup.

## O que o backup do banco não cobre

- **Fotos (S3).** São 20.106 arquivos, 2,8 GiB, e só existem lá (os originais do antigo CDN do Supremo não são mais a fonte).
  Cópia local: `aws s3 sync s3://a3-imoveis-fotos ~/backups/website-A3/s3 --profile a3`. Excluir um imóvel no painel apaga as
  fotos dele do S3 de vez, de propósito: o bucket não tem versionamento, então essa exclusão não tem volta, nem pelo backup do banco.
- **Arquivos antigos** (export do Supremo, SQLs de carga, protótipos): `s3://a3-imoveis-fotos/arquivo/2026-10-23/`.
- **Auth, Storage e funções do Supabase:** o site não usa; não estão na cópia.
