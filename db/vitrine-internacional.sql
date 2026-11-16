-- Vitrine da área internacional por idioma (docs/area-internacional.md): o imóvel do topo e os destaques da página
-- inicial de cada idioma (/en, /it, /es, /fr, /de), escolhidos no painel (/admin/vitrine, abas dos idiomas).
-- Um idioma sem linha em vitrine_internacional nunca foi configurado: a página dele usa a seleção automática (os destaques
-- da home em português que estão no recorte internacional, completados com os mais recentes).
-- Como as tabelas da vitrine em português, guardam o id do imóvel no site sem chave estrangeira (no modo Viniun há ids que
-- não existem na tabela imoveis); imóvel que sai do site some da vitrine sozinho, e excluir pelo painel limpa as escolhas.
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Pode rodar de novo. Sem estas tabelas o site funciona (seleção
-- automática), mas o painel não salva a vitrine dos idiomas.
-- Para desfazer: DROP TABLE public.vitrine_internacional_destaques; DROP TABLE public.vitrine_internacional;
BEGIN;

CREATE TABLE IF NOT EXISTS public.vitrine_internacional (
  idioma text PRIMARY KEY CHECK (idioma IN ('en', 'it', 'es', 'fr', 'de')),
  -- Imóvel do topo da página inicial do idioma.
  heroi_id text,
  atualizada_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vitrine_internacional_destaques (
  idioma text NOT NULL REFERENCES public.vitrine_internacional (idioma) ON DELETE CASCADE,
  posicao integer NOT NULL CHECK (posicao >= 0),
  imovel_id text NOT NULL,
  PRIMARY KEY (idioma, posicao),
  UNIQUE (idioma, imovel_id)
);

-- Fechadas para a API pública do Supabase, como as demais (db/seguranca-rls.sql).
ALTER TABLE public.vitrine_internacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitrine_internacional_destaques ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vitrine_internacional, public.vitrine_internacional_destaques FROM anon, authenticated;

COMMIT;

-- Conferir: SELECT v.idioma, v.heroi_id, count(d.*) FROM vitrine_internacional v
--           LEFT JOIN vitrine_internacional_destaques d USING (idioma) GROUP BY 1, 2;
