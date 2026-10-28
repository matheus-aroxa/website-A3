-- Estrutura do banco (PostgreSQL 17 / Supabase): schema `public`, sem dados.
-- Gerada com `pg_dump --schema=public --schema-only --no-owner --no-acl` a partir do banco em uso (24/10/2026) mais as migrações
-- aplicadas depois: db/construtoras.sql e db/relatorios.sql (a anterior, db/suites-faixa.sql, já estava incluída).
-- Os dados ficam no backup (docs/backup-banco.md).
--
-- Para montar um banco novo: rodar este arquivo e depois db/seguranca-rls.sql. Requer a extensão pgcrypto, que no Supabase
-- já vem ativa no schema `extensions` (o login confere a senha com extensions.crypt, ver docs/login-admin.md).
-- Mudanças futuras entram como arquivos novos em db/ e devem ser refletidas aqui.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: finalidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.finalidade AS ENUM (
    'venda',
    'aluguel'
);


--
-- Name: origem_imovel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.origem_imovel AS ENUM (
    'supremo',
    'painel'
);


--
-- Name: situacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao AS ENUM (
    'breve-lancamento',
    'lancamento',
    'em-construcao',
    'pronto'
);


--
-- Name: status_imovel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_imovel AS ENUM (
    'ativo',
    'inativo',
    'excluido'
);


--
-- Name: tipo_imovel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_imovel AS ENUM (
    'apartamento',
    'casa-condominio',
    'terreno'
);


--
-- Name: atualizar_alterado_em(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_alterado_em() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.alterado_em = now();
  RETURN NEW;
END;
$$;


--
-- Name: construtora_padrao_fixa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.construtora_padrao_fixa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.padrao THEN RAISE EXCEPTION 'A construtora padrão não pode ser alterada nem excluída.'; END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    nome text,
    senha_hash text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    ultimo_acesso timestamp with time zone,
    CONSTRAINT administradores_email_check CHECK (((email = lower(btrim(email))) AND (email <> ''::text)))
);


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id bigint NOT NULL,
    imovel_id text,
    acao text NOT NULL,
    autor text NOT NULL,
    campos jsonb,
    em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.auditoria ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bairros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bairros (
    id integer NOT NULL,
    cidade_id integer NOT NULL,
    nome text NOT NULL,
    slug text NOT NULL
);


--
-- Name: bairros_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.bairros ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bairros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cidades (
    id integer NOT NULL,
    nome text NOT NULL,
    slug text NOT NULL,
    uf character(2) NOT NULL
);


--
-- Name: cidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cidades ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: construtoras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.construtoras (
    id integer NOT NULL,
    nome text NOT NULL,
    slug text NOT NULL,
    padrao boolean DEFAULT false NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT construtoras_nome_check CHECK ((btrim(nome) <> ''::text))
);


--
-- Name: construtoras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.construtoras ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.construtoras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: crm_empreendimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_empreendimentos (
    vem_id integer NOT NULL,
    vem_nome text,
    vem_comissao_automatica smallint,
    vem_comissoes_forma_repasse integer,
    vem_comissao_dias_repasse text,
    vco_id integer,
    sit_id integer,
    vem_descricao text,
    vem_quartos text,
    vem_banheiros text,
    vem_garagens text,
    vem_area_privativa text,
    vem_area_total text,
    vem_situacao integer,
    vem_fl_finalidade smallint,
    vem_fl_agrupamento_unidades text,
    vem_estagio_obra integer,
    vem_endereco text,
    vem_bairro text,
    vem_cidade_uf text,
    vem_latitude text,
    vem_longitude text,
    vem_publicar smallint,
    vem_mcmv smallint,
    vem_entrega date,
    vem_tipo integer,
    vem_mkt_apelo_curto_1 text,
    vem_mkt_apelo_curto_2 text,
    vem_mkt_apelo_medio_1 text,
    vem_mkt_apelo_medio_2 text,
    vem_mkt_apelo_longo_1 text,
    vem_mkt_apelo_longo_2 text,
    vem_mkt_prazo_1 text,
    vem_mkt_prazo_2 text,
    vem_mkt_local_1 text,
    vem_mkt_local_2 text,
    vem_mkt_logo text,
    vem_mkt_logo_aws_url text,
    vem_mkt_logo_aws_fl_migrado smallint,
    vem_preco text,
    vem_fl_exibir_preco_no_site smallint,
    vem_preco_lote text,
    vem_fl_alugar smallint,
    brs_id integer,
    bre_id integer,
    bro_id integer,
    brp_id integer,
    pest_id integer,
    pcid_id integer,
    pbar_id integer,
    imre_id integer,
    vem_numero text,
    vem_complemento text,
    vem_cep text,
    vem_views integer,
    vem_integracao_canalpro smallint,
    vem_integracao_canalpro_tipo text,
    vem_integracao_imovelweb smallint,
    vem_integracao_imovelweb_tipo text,
    vem_codigo_interno text,
    vem_integracao_dwv_id text,
    vem_integracao_dwv_id_base text,
    vem_integracao_dwv_id_pai text,
    vem_integracao_orulo_id text,
    vem_integracao_orulo_data_sincronizacao text,
    vem_integracao_chavesnamao smallint,
    vem_integracao_chavesnamao_tipo text,
    usu_id_cadastro integer,
    vem_data_cadastro timestamp without time zone,
    usu_id_edicao integer,
    vem_data_edicao timestamp without time zone,
    vem_data_atualizacao timestamp without time zone,
    vem_anotacoes_internas text,
    brp_nome text,
    bro_sigla text,
    bre_nome text,
    brs_nome text,
    vco_nome text,
    total_fotos integer,
    tipo_nome text,
    vem_data_edicao_diff text,
    vem_data_edicao_diff_dias text,
    vem_data_edicao_diff_meses text,
    vem_data_edicao_diff_anos text,
    publicado boolean NOT NULL,
    ficha_texto text,
    importacao_id integer
);


--
-- Name: crm_fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_fotos (
    id bigint NOT NULL,
    empreendimento_id integer,
    imovel_id integer,
    posicao integer NOT NULL,
    url text NOT NULL,
    url_miniatura text,
    secao text,
    CONSTRAINT crm_fotos_posicao_check CHECK ((posicao >= 0)),
    CONSTRAINT crm_fotos_um_dono CHECK (((empreendimento_id IS NULL) <> (imovel_id IS NULL)))
);


--
-- Name: crm_fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.crm_fotos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.crm_fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: crm_imoveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_imoveis (
    imo_id integer NOT NULL,
    imo_nome text,
    imo_endereco text,
    imo_numero text,
    imo_complemento text,
    imo_latitude double precision,
    imo_longitude double precision,
    imo_situacao integer,
    imo_tipo integer,
    imo_numero_quartos integer,
    imo_numero_banheiros integer,
    imo_numero_suites integer,
    imo_numero_garagens integer,
    imo_area_construida text,
    imo_posicao_solar text,
    imo_valor text,
    imo_condominio text,
    imp_nome text,
    brs_nome text,
    bre_nome text,
    bro_nome text,
    bro_sigla text,
    imo_integracao_olx smallint,
    imo_integracao_vivareal smallint,
    imo_integracao_zapimoveis smallint,
    imo_integracao_canalpro smallint,
    imo_views integer,
    imo_integracao_imovelweb smallint,
    imo_integracao_casamineira smallint,
    imo_codigo_interno text,
    imo_nota_portais text,
    imo_fl_novo smallint,
    pro_id integer,
    pro_nome text,
    pro_telefone text,
    pro_celular text,
    pro_tel3 text,
    vcr_nome text,
    vcr_login text,
    vcr_ativo smallint,
    imo_data_edicao timestamp without time zone,
    imo_integracao_orulo_id text,
    imo_integracao_dwv_id text,
    imo_integracao_dwv_id_pai text,
    imo_alugado smallint,
    total_fotos integer,
    cond_id text,
    cond_nome text,
    idi_id integer,
    idi_nome text,
    idi_fl_form_site_visivel smallint,
    imo_data_cadastro timestamp without time zone,
    imo_nota_portais_original integer,
    imo_data_edicao_diff text,
    imo_data_edicao_diff_dias text,
    imo_data_edicao_diff_meses text,
    imo_data_edicao_diff_anos text,
    campos_edicao jsonb DEFAULT '{}'::jsonb NOT NULL,
    importacao_id integer
);


--
-- Name: crm_importacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_importacoes (
    id integer NOT NULL,
    gerado_em timestamp with time zone NOT NULL,
    origem text NOT NULL,
    totais jsonb NOT NULL,
    importado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crm_importacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.crm_importacoes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.crm_importacoes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventos (
    id bigint NOT NULL,
    em timestamp with time zone DEFAULT now() NOT NULL,
    dia date DEFAULT ((now() AT TIME ZONE 'America/Recife'::text))::date NOT NULL,
    tipo text NOT NULL,
    visitante text NOT NULL,
    sessao uuid NOT NULL,
    nova_sessao boolean DEFAULT false NOT NULL,
    pv text,
    caminho text NOT NULL,
    imovel_id text,
    rotulo text,
    valor integer,
    detalhe jsonb,
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
    tempo_s integer,
    rolagem smallint,
    vitais jsonb
);


--
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.eventos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.eventos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fotos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fotos (
    id bigint NOT NULL,
    imovel_id text NOT NULL,
    posicao integer NOT NULL,
    src text NOT NULL,
    largura integer DEFAULT 1600 NOT NULL,
    altura integer DEFAULT 1200 NOT NULL,
    alt text NOT NULL,
    legenda text,
    blur_data_url text,
    capa boolean DEFAULT false NOT NULL,
    CONSTRAINT fotos_posicao_check CHECK ((posicao >= 0))
);


--
-- Name: fotos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fotos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fotos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: imoveis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imoveis (
    id text NOT NULL,
    crm_empreendimento_id integer,
    crm_imovel_id integer,
    codigo text NOT NULL,
    slug text NOT NULL,
    nome text NOT NULL,
    tipo public.tipo_imovel NOT NULL,
    finalidade public.finalidade NOT NULL,
    situacao public.situacao NOT NULL,
    bairro_id integer NOT NULL,
    logradouro text,
    latitude double precision,
    longitude double precision,
    preco numeric(14,2) NOT NULL,
    area_min numeric(10,2) NOT NULL,
    area_max numeric(10,2) NOT NULL,
    quartos_min smallint NOT NULL,
    quartos_max smallint NOT NULL,
    banheiros_min smallint NOT NULL,
    banheiros_max smallint NOT NULL,
    vagas_min smallint,
    vagas_max smallint,
    suites smallint,
    entrega character(7),
    mcmv boolean DEFAULT false NOT NULL,
    chamada text NOT NULL,
    construtora text,
    unidades text,
    descricao text[] DEFAULT '{}'::text[] NOT NULL,
    lazer text[] DEFAULT '{}'::text[] NOT NULL,
    proximidades text[] DEFAULT '{}'::text[] NOT NULL,
    destaque boolean DEFAULT false NOT NULL,
    heroi boolean DEFAULT false NOT NULL,
    original jsonb,
    status public.status_imovel DEFAULT 'ativo'::public.status_imovel NOT NULL,
    origem public.origem_imovel DEFAULT 'supremo'::public.origem_imovel NOT NULL,
    editado boolean DEFAULT false NOT NULL,
    publicado_em date NOT NULL,
    atualizado_em date NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    alterado_em timestamp with time zone DEFAULT now() NOT NULL,
    suites_min integer,
    suites_max integer,
    construtora_id integer DEFAULT 1 NOT NULL,
    CONSTRAINT coordenadas CHECK (((latitude IS NULL) = (longitude IS NULL))),
    CONSTRAINT faixa_area CHECK ((area_min <= area_max)),
    CONSTRAINT faixa_banheiros CHECK ((banheiros_min <= banheiros_max)),
    CONSTRAINT faixa_quartos CHECK ((quartos_min <= quartos_max)),
    CONSTRAINT faixa_vagas CHECK ((((vagas_min IS NULL) = (vagas_max IS NULL)) AND ((vagas_min IS NULL) OR (vagas_min <= vagas_max)))),
    CONSTRAINT imoveis_entrega_check CHECK ((entrega ~ '^\d{4}-(0[1-9]|1[0-2])$'::text)),
    CONSTRAINT imoveis_preco_check CHECK ((preco >= (0)::numeric)),
    CONSTRAINT imoveis_suites_faixa_check CHECK ((((suites_min IS NULL) = (suites_max IS NULL)) AND ((suites_min IS NULL) OR ((suites_min >= 0) AND (suites_min <= suites_max))))),
    CONSTRAINT um_registro_crm CHECK (((crm_empreendimento_id IS NULL) OR (crm_imovel_id IS NULL)))
);


--
-- Name: plantas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plantas (
    id bigint NOT NULL,
    imovel_id text NOT NULL,
    posicao integer NOT NULL,
    titulo text NOT NULL,
    descricao text DEFAULT ''::text NOT NULL,
    area numeric(10,2) NOT NULL,
    foto_src text NOT NULL,
    foto_largura integer DEFAULT 1600 NOT NULL,
    foto_altura integer DEFAULT 1200 NOT NULL,
    foto_alt text NOT NULL,
    CONSTRAINT plantas_posicao_check CHECK ((posicao >= 0))
);


--
-- Name: plantas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.plantas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.plantas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: resumo_diario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resumo_diario (
    dia date NOT NULL,
    dimensao text NOT NULL,
    chave text NOT NULL,
    imovel_id text DEFAULT ''::text NOT NULL,
    visitas integer DEFAULT 0 NOT NULL,
    visitantes integer DEFAULT 0 NOT NULL,
    sessoes integer DEFAULT 0 NOT NULL,
    rejeicoes integer DEFAULT 0 NOT NULL,
    conversoes integer DEFAULT 0 NOT NULL,
    eventos integer DEFAULT 0 NOT NULL,
    tempo_s bigint DEFAULT 0 NOT NULL,
    valor bigint DEFAULT 0 NOT NULL
);


--
-- Name: sal_visitantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sal_visitantes (
    dia date NOT NULL,
    sal text NOT NULL
);


--
-- Name: sessoes_admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessoes_admin (
    token_hash text NOT NULL,
    admin_id uuid NOT NULL,
    criada_em timestamp with time zone DEFAULT now() NOT NULL,
    expira_em timestamp with time zone NOT NULL,
    ip text,
    agente text
);


--
-- Name: tentativas_login; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tentativas_login (
    id bigint NOT NULL,
    ip text NOT NULL,
    email text,
    em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tentativas_login_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tentativas_login ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tentativas_login_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vitrine_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitrine_config (
    id boolean DEFAULT true NOT NULL,
    personalizada boolean DEFAULT false NOT NULL,
    heroi_id text,
    CONSTRAINT vitrine_config_id_check CHECK (id)
);


--
-- Name: vitrine_destaques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitrine_destaques (
    posicao integer NOT NULL,
    imovel_id text NOT NULL,
    CONSTRAINT vitrine_destaques_posicao_check CHECK ((posicao >= 0))
);


--
-- Name: administradores administradores_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_email_key UNIQUE (email);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: bairros bairros_cidade_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT bairros_cidade_id_slug_key UNIQUE (cidade_id, slug);


--
-- Name: bairros bairros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT bairros_pkey PRIMARY KEY (id);


--
-- Name: cidades cidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT cidades_pkey PRIMARY KEY (id);


--
-- Name: cidades cidades_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT cidades_slug_key UNIQUE (slug);


--
-- Name: construtoras construtoras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.construtoras
    ADD CONSTRAINT construtoras_pkey PRIMARY KEY (id);


--
-- Name: crm_empreendimentos crm_empreendimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_empreendimentos
    ADD CONSTRAINT crm_empreendimentos_pkey PRIMARY KEY (vem_id);


--
-- Name: crm_fotos crm_fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_fotos
    ADD CONSTRAINT crm_fotos_pkey PRIMARY KEY (id);


--
-- Name: crm_imoveis crm_imoveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_imoveis
    ADD CONSTRAINT crm_imoveis_pkey PRIMARY KEY (imo_id);


--
-- Name: crm_importacoes crm_importacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_importacoes
    ADD CONSTRAINT crm_importacoes_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: fotos fotos_imovel_id_posicao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_imovel_id_posicao_key UNIQUE (imovel_id, posicao);


--
-- Name: fotos fotos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_pkey PRIMARY KEY (id);


--
-- Name: imoveis imoveis_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_codigo_key UNIQUE (codigo);


--
-- Name: imoveis imoveis_crm_empreendimento_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_crm_empreendimento_id_key UNIQUE (crm_empreendimento_id);


--
-- Name: imoveis imoveis_crm_imovel_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_crm_imovel_id_key UNIQUE (crm_imovel_id);


--
-- Name: imoveis imoveis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_pkey PRIMARY KEY (id);


--
-- Name: imoveis imoveis_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_slug_key UNIQUE (slug);


--
-- Name: plantas plantas_imovel_id_posicao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantas
    ADD CONSTRAINT plantas_imovel_id_posicao_key UNIQUE (imovel_id, posicao);


--
-- Name: plantas plantas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantas
    ADD CONSTRAINT plantas_pkey PRIMARY KEY (id);


--
-- Name: resumo_diario resumo_diario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumo_diario
    ADD CONSTRAINT resumo_diario_pkey PRIMARY KEY (dia, dimensao, chave, imovel_id);


--
-- Name: sal_visitantes sal_visitantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sal_visitantes
    ADD CONSTRAINT sal_visitantes_pkey PRIMARY KEY (dia);


--
-- Name: sessoes_admin sessoes_admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_admin
    ADD CONSTRAINT sessoes_admin_pkey PRIMARY KEY (token_hash);


--
-- Name: tentativas_login tentativas_login_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentativas_login
    ADD CONSTRAINT tentativas_login_pkey PRIMARY KEY (id);


--
-- Name: vitrine_config vitrine_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_config
    ADD CONSTRAINT vitrine_config_pkey PRIMARY KEY (id);


--
-- Name: vitrine_destaques vitrine_destaques_imovel_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_destaques
    ADD CONSTRAINT vitrine_destaques_imovel_id_key UNIQUE (imovel_id);


--
-- Name: vitrine_destaques vitrine_destaques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_destaques
    ADD CONSTRAINT vitrine_destaques_pkey PRIMARY KEY (posicao);


--
-- Name: auditoria_imovel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auditoria_imovel ON public.auditoria USING btree (imovel_id, em DESC);


--
-- Name: auditoria_recentes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auditoria_recentes ON public.auditoria USING btree (em DESC);


--
-- Name: construtoras_nome_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX construtoras_nome_key ON public.construtoras USING btree (lower(nome));


--
-- Name: construtoras_padrao_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX construtoras_padrao_key ON public.construtoras USING btree (padrao) WHERE padrao;


--
-- Name: construtoras_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX construtoras_slug_key ON public.construtoras USING btree (slug);


--
-- Name: crm_empreendimentos_publicado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crm_empreendimentos_publicado ON public.crm_empreendimentos USING btree (publicado);


--
-- Name: crm_fotos_posicao_emp; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX crm_fotos_posicao_emp ON public.crm_fotos USING btree (empreendimento_id, posicao) WHERE (empreendimento_id IS NOT NULL);


--
-- Name: crm_fotos_posicao_imo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX crm_fotos_posicao_imo ON public.crm_fotos USING btree (imovel_id, posicao) WHERE (imovel_id IS NOT NULL);


--
-- Name: eventos_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX eventos_dia ON public.eventos USING btree (dia);


--
-- Name: eventos_pv; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX eventos_pv ON public.eventos USING btree (pv) WHERE (pv IS NOT NULL);


--
-- Name: eventos_visitante; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX eventos_visitante ON public.eventos USING btree (visitante, em DESC);


--
-- Name: fotos_uma_capa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fotos_uma_capa ON public.fotos USING btree (imovel_id) WHERE capa;


--
-- Name: imoveis_busca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imoveis_busca ON public.imoveis USING btree (finalidade, tipo, bairro_id) WHERE (status = 'ativo'::public.status_imovel);


--
-- Name: imoveis_construtora_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imoveis_construtora_id_idx ON public.imoveis USING btree (construtora_id);


--
-- Name: imoveis_preco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imoveis_preco ON public.imoveis USING btree (preco) WHERE (status = 'ativo'::public.status_imovel);


--
-- Name: imoveis_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX imoveis_status ON public.imoveis USING btree (status);


--
-- Name: imoveis_um_heroi; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX imoveis_um_heroi ON public.imoveis USING btree (heroi) WHERE heroi;


--
-- Name: resumo_diario_dimensao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX resumo_diario_dimensao ON public.resumo_diario USING btree (dimensao, dia);


--
-- Name: sessoes_admin_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessoes_admin_admin ON public.sessoes_admin USING btree (admin_id);


--
-- Name: sessoes_admin_expira; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessoes_admin_expira ON public.sessoes_admin USING btree (expira_em);


--
-- Name: tentativas_login_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tentativas_login_email ON public.tentativas_login USING btree (email, em DESC);


--
-- Name: tentativas_login_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tentativas_login_ip ON public.tentativas_login USING btree (ip, em DESC);


--
-- Name: construtoras construtora_padrao_fixa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER construtora_padrao_fixa BEFORE DELETE OR UPDATE ON public.construtoras FOR EACH ROW EXECUTE FUNCTION public.construtora_padrao_fixa();


--
-- Name: imoveis imoveis_alterado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER imoveis_alterado_em BEFORE UPDATE ON public.imoveis FOR EACH ROW EXECUTE FUNCTION public.atualizar_alterado_em();


--
-- Name: auditoria auditoria_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE SET NULL;


--
-- Name: bairros bairros_cidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bairros
    ADD CONSTRAINT bairros_cidade_id_fkey FOREIGN KEY (cidade_id) REFERENCES public.cidades(id) ON DELETE RESTRICT;


--
-- Name: crm_empreendimentos crm_empreendimentos_importacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_empreendimentos
    ADD CONSTRAINT crm_empreendimentos_importacao_id_fkey FOREIGN KEY (importacao_id) REFERENCES public.crm_importacoes(id);


--
-- Name: crm_fotos crm_fotos_empreendimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_fotos
    ADD CONSTRAINT crm_fotos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES public.crm_empreendimentos(vem_id) ON DELETE CASCADE;


--
-- Name: crm_fotos crm_fotos_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_fotos
    ADD CONSTRAINT crm_fotos_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.crm_imoveis(imo_id) ON DELETE CASCADE;


--
-- Name: crm_imoveis crm_imoveis_importacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_imoveis
    ADD CONSTRAINT crm_imoveis_importacao_id_fkey FOREIGN KEY (importacao_id) REFERENCES public.crm_importacoes(id);


--
-- Name: fotos fotos_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fotos
    ADD CONSTRAINT fotos_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;


--
-- Name: imoveis imoveis_bairro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_bairro_id_fkey FOREIGN KEY (bairro_id) REFERENCES public.bairros(id) ON DELETE RESTRICT;


--
-- Name: imoveis imoveis_construtora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_construtora_id_fkey FOREIGN KEY (construtora_id) REFERENCES public.construtoras(id) ON DELETE RESTRICT;


--
-- Name: imoveis imoveis_crm_empreendimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_crm_empreendimento_id_fkey FOREIGN KEY (crm_empreendimento_id) REFERENCES public.crm_empreendimentos(vem_id) ON DELETE SET NULL;


--
-- Name: imoveis imoveis_crm_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imoveis
    ADD CONSTRAINT imoveis_crm_imovel_id_fkey FOREIGN KEY (crm_imovel_id) REFERENCES public.crm_imoveis(imo_id) ON DELETE SET NULL;


--
-- Name: plantas plantas_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plantas
    ADD CONSTRAINT plantas_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;


--
-- Name: sessoes_admin sessoes_admin_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_admin
    ADD CONSTRAINT sessoes_admin_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.administradores(id) ON DELETE CASCADE;


--
-- Name: vitrine_config vitrine_config_heroi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_config
    ADD CONSTRAINT vitrine_config_heroi_id_fkey FOREIGN KEY (heroi_id) REFERENCES public.imoveis(id) ON DELETE SET NULL;


--
-- Name: vitrine_destaques vitrine_destaques_imovel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitrine_destaques
    ADD CONSTRAINT vitrine_destaques_imovel_id_fkey FOREIGN KEY (imovel_id) REFERENCES public.imoveis(id) ON DELETE CASCADE;


-- Linha única de configuração da vitrine da home: as consultas fazem CROSS JOIN com ela, então sem esta linha nada aparece.
INSERT INTO public.vitrine_config (id, personalizada) VALUES (true, false) ON CONFLICT DO NOTHING;
