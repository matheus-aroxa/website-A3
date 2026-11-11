-- Cópia local das fichas de imóveis da Viniun (catálogo do CRM, docs/integracao-viniun.md).
-- A Viniun continua sendo a fonte: a cada atualização do cache, o site pede a lista de imóveis (uma chamada) e só baixa
-- de novo as fichas novas ou alteradas; o resto sai daqui. Sem esta tabela, cada atualização (e cada deploy) baixaria
-- as ~330 fichas, uma chamada por imóvel (~40 s). Ela também segura o site se a Viniun sair do ar.
-- Só é usada com FONTE_IMOVEIS=viniun. Aplicar antes de ligar o modo Viniun.
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Pode rodar de novo.
-- Para desfazer: DROP TABLE public.viniun_fichas;
BEGIN;

CREATE TABLE IF NOT EXISTS public.viniun_fichas (
  slug text PRIMARY KEY,
  -- Data de atualização informada pela Viniun (GET /imoveis/slugs): mudou, a ficha é baixada de novo.
  atualizado_em text NOT NULL,
  -- A ficha não diz se é Minha Casa Minha Vida: vem do filtro da busca e é atualizado a cada carga.
  mcmv boolean NOT NULL DEFAULT false,
  dados jsonb NOT NULL,
  baixado_em timestamptz NOT NULL DEFAULT now()
);

-- Fechada para a API pública do Supabase, como as demais (db/seguranca-rls.sql).
ALTER TABLE public.viniun_fichas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.viniun_fichas FROM anon, authenticated;

COMMIT;

-- Conferir: SELECT count(*), max(baixado_em) FROM viniun_fichas;
