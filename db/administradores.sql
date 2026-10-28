-- Administrador principal: o único que cadastra, desativa e reativa os outros administradores pelo painel
-- (/admin/administradores). Os demais têm acesso a todo o resto do painel, mas não a essa tela. Docs: docs/login-admin.md.
--
-- O administrador ativo mais antigo vira o principal (hoje só existe um). Para passar o papel a outro, ver docs/login-admin.md.
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Antes, faça um backup (docs/backup-banco.md). Pode rodar de novo.
-- Aplicar ANTES de publicar o código que usa a coluna: o login a lê, e sem ela ninguém entra no painel. O código antigo
-- continua funcionando com a coluna nova.
-- Para desfazer: ALTER TABLE public.administradores DROP COLUMN principal;
BEGIN;

ALTER TABLE public.administradores ADD COLUMN IF NOT EXISTS principal boolean NOT NULL DEFAULT false;

-- No máximo um principal.
CREATE UNIQUE INDEX IF NOT EXISTS administradores_principal_key ON public.administradores (principal) WHERE principal;

-- O principal não pode ser desativado: ninguém mais conseguiria cadastrar ou reativar administradores pelo painel.
ALTER TABLE public.administradores DROP CONSTRAINT IF EXISTS administradores_principal_ativo;
ALTER TABLE public.administradores ADD CONSTRAINT administradores_principal_ativo CHECK (ativo OR NOT principal);

UPDATE public.administradores SET principal = true
 WHERE id = (SELECT id FROM public.administradores WHERE ativo ORDER BY criado_em LIMIT 1)
   AND NOT EXISTS (SELECT 1 FROM public.administradores WHERE principal);

COMMIT;

-- Conferir: SELECT email, nome, principal FROM administradores ORDER BY criado_em;
