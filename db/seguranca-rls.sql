-- Fecha o acesso pela API do Supabase às tabelas do site.
--
-- O Supabase expõe o schema `public` por uma API (REST/GraphQL) para os papéis `anon` e `authenticated`, e esses papéis
-- recebem todas as permissões nas tabelas novas. Sem RLS (row level security), quem tiver a chave pública ("anon key",
-- que aparece no painel do Supabase) consegue ler os hashes de `administradores`, cadastrar um administrador novo ou
-- apagar o catálogo.
--
-- O site não usa essa API: ele conecta direto no Postgres como `postgres`, que ignora o RLS (BYPASSRLS). Por isso nada
-- muda para o site nem para o painel. Pode rodar de novo sem problema.
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Antes, faça um backup (docs/backup-banco.md).
-- Conferir depois (tem que dar "permission denied"): SET ROLE anon; SELECT count(*) FROM administradores; RESET ROLE;
BEGIN;

-- 1. RLS ligado em todas as tabelas, sem nenhuma política: para anon e authenticated, nada é lido nem gravado.
DO $$
DECLARE
  tabela text;
BEGIN
  FOR tabela IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
  END LOOP;
END $$;

-- 2. Tira também as permissões, para continuar fechado mesmo se alguém desligar o RLS sem querer.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 3. O que for criado daqui para frente já nasce sem acesso para esses papéis (o RLS de cada tabela nova continua
--    sendo ligado à mão: ALTER TABLE ... ENABLE ROW LEVEL SECURITY).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;

-- Para desfazer (não recomendado):
--   ALTER TABLE public.<tabela> DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
