# Migração do banco para São Paulo

Motivo: o Supabase atual está na AWS `us-east-1`. A latência até ele é de ~130ms por consulta e ~1s para abrir
uma conexão nova, o que pesa sempre que o cache do site esfria. Um projeto em `sa-east-1` reduz isso para ~10ms.

## Passo a passo

1. **Criar o projeto no Supabase** com a região **South America (São Paulo)**. Anote a senha do banco.
2. **Copiar a string de conexão** em Project Settings → Database → Connection string. Use a conexão direta
   (porta 5432) ou a do pooler em modo *session*. Evite o modo *transaction* (porta 6543) para esta cópia.
3. **Pôr no `.env.local`** (arquivo ignorado pelo git), sem mexer no `DATABASE_URL`:
   ```
   NOVO_DATABASE_URL=postgresql://postgres:<senha>@db.<projeto>.supabase.co:5432/postgres
   ```
4. **Conferir sem gravar nada:**
   ```
   node --env-file=.env.local scripts/copiar-banco.mjs --dry-run
   ```
5. **Copiar:**
   ```
   node --env-file=.env.local scripts/copiar-banco.mjs
   ```
   O script só confirma a cópia se a contagem e o hash de cada tabela baterem. Se algo falhar, o destino não é alterado
   (o schema pode ficar criado; rodar de novo é seguro, e `--limpar` apaga dados já copiados no destino).
6. **Trocar o `DATABASE_URL`** (no `.env.local` e no ambiente de produção) pelo valor do banco novo e reiniciar o site.
7. **Revalidar o cache** (`POST /api/revalidar`) ou fazer um novo deploy.
8. Manter o banco antigo por alguns dias, só como reserva, e depois pausá-lo ou apagá-lo.

## O que o script faz

- Lê a origem numa transação `READ ONLY` com um retrato consistente: pode ser rodado com o site no ar.
- Cria o schema no destino a partir de `db/schema.sql` se ele estiver sem tabelas.
- Copia todas as tabelas de `public` na ordem das chaves estrangeiras, preservando ids, e acerta as sequências
  (o próximo `id` gerado continua depois do maior copiado).
- Não copia tabelas `*_backup*` (os backups da troca de links das fotos).
- Recusa rodar se origem e destino forem o mesmo banco ou se o destino já tiver dados (sem `--limpar`).

## Cuidados

- Enquanto a cópia não for trocada no `DATABASE_URL`, edições feitas no painel vão para o banco antigo. Evite editar
  entre o passo 5 e o 6, ou rode a cópia de novo com `--limpar` logo antes de trocar.
- Uploads do painel ficam em `ADMIN_DADOS_DIR` (disco local), não no banco: não são afetados por esta migração.
- Testado contra um Postgres 16 descartável em Docker: 12 tabelas copiadas, contagens e hashes iguais, sequências corretas.
