-- Medição de uso do site, para os relatórios do painel (/admin/relatorios). Docs: docs/relatorios.md.
--
-- Sem cookies de visitante e sem IP gravado. Três tabelas:
--   eventos         o que aconteceu: visitas, cliques no WhatsApp/telefone/e-mail, formulários enviados, buscas, erros...
--                   Fica 90 dias; depois de resumido, o evento bruto é apagado.
--   resumo_diario   contagens por dia, por dimensão (origem, aparelho, página, imóvel...). Guardado para sempre.
--   sal_visitantes  o "sal" de cada dia. O código anônimo do visitante é um hash de IP + navegador + este sal; o sal do
--                   dia é apagado em 2 dias, então o código não pode ser refeito nem ligado a outro dia.
--
-- Nenhuma coluna guarda nome, telefone, mensagem ou IP. O que a pessoa digita nos formulários nunca chega aqui.
--
-- Como aplicar: Supabase > SQL Editor > colar e rodar. Antes, faça um backup (docs/backup-banco.md). Pode rodar de novo.
-- Para desfazer: DROP TABLE public.eventos, public.resumo_diario, public.sal_visitantes;
BEGIN;

CREATE TABLE IF NOT EXISTS public.sal_visitantes (
  dia date PRIMARY KEY,
  sal text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.eventos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  em timestamptz NOT NULL DEFAULT now(),
  -- Dia no horário de Recife: é o dia que os relatórios mostram.
  dia date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Recife')::date),
  -- visita, whatsapp, ligacao, email, formulario-iniciado, formulario-enviado, formulario-erro, galeria, planta, mapa,
  -- compartilhar, card, busca, externo, nao-encontrada, erro, acao
  tipo text NOT NULL,
  visitante text NOT NULL,
  -- Uma sessão termina após 30 min sem eventos do mesmo visitante.
  sessao uuid NOT NULL,
  nova_sessao boolean NOT NULL DEFAULT false,
  -- Identifica a visualização de página (só nas visitas); a saída da página completa a mesma linha.
  pv text,
  caminho text NOT NULL,
  -- Imóvel da página, ou o imóvel clicado/consultado (sem chave estrangeira: o imóvel excluído continua nos números).
  imovel_id text,
  rotulo text,
  valor integer,
  detalhe jsonb,
  -- Só na linha que abre a sessão:
  canal text,
  origem text,
  campanha text,
  dispositivo text,
  navegador text,
  so text,
  idioma text,
  pais text,
  estado text,
  cidade text,
  -- Só nas visitas, preenchidos quando a pessoa sai da página:
  tempo_s integer,
  rolagem smallint,
  vitais jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS eventos_pv ON public.eventos (pv) WHERE pv IS NOT NULL;
CREATE INDEX IF NOT EXISTS eventos_dia ON public.eventos (dia);
-- Acha a sessão aberta de um visitante.
CREATE INDEX IF NOT EXISTS eventos_visitante ON public.eventos (visitante, em DESC);

CREATE TABLE IF NOT EXISTS public.resumo_diario (
  dia date NOT NULL,
  dimensao text NOT NULL,
  chave text NOT NULL,
  imovel_id text NOT NULL DEFAULT '',
  visitas integer NOT NULL DEFAULT 0,
  visitantes integer NOT NULL DEFAULT 0,
  sessoes integer NOT NULL DEFAULT 0,
  rejeicoes integer NOT NULL DEFAULT 0,
  conversoes integer NOT NULL DEFAULT 0,
  eventos integer NOT NULL DEFAULT 0,
  tempo_s bigint NOT NULL DEFAULT 0,
  valor bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (dia, dimensao, chave, imovel_id)
);

CREATE INDEX IF NOT EXISTS resumo_diario_dimensao ON public.resumo_diario (dimensao, dia);

-- Mesmo fechamento das outras tabelas (db/seguranca-rls.sql): a API pública do Supabase não lê nem grava nada aqui.
ALTER TABLE public.sal_visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_diario ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sal_visitantes, public.eventos, public.resumo_diario FROM anon, authenticated;

COMMIT;
