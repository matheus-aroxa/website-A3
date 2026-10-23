'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { criarImovel, descartarEdicoes, salvarImovel } from '@/app/admin/acoes'
import logoMcmv from '@/assets/marca/logo-mcmv.png'
import { CardImovel } from '@/components/imoveis/CardImovel'
import { Icone } from '@/components/ui/Icone'
import { MapaEstatico } from '@/components/ui/MapaEstatico'
import { Seletor } from '@/components/ui/Seletor'
import { ESTADO_INICIAL, type EstadoFormulario } from '@/lib/formularios'
import type { StatusImovel } from '@/lib/imoveis/painel'
import { SITUACOES, TIPOS, lerNumeroBr, rotuloSituacao, rotuloTipo } from '@/lib/imoveis/formato'
import { urlImovel } from '@/lib/imoveis/rotas'
import type { Faixa, Imovel, ImovelResumo } from '@/lib/imoveis/tipos'
import { useAvisar } from './Avisos'
import { Confirmacao, type PedidoConfirmacao } from './Confirmacao'
import { TEXTO_EXCLUSAO, useMudarStatus } from './status'
import { Secao } from './TopoPagina'
import s from './Admin.module.css'
import carregadorImagem from '@/lib/imoveis/carregador-imagem'

// ---------- Valores do formulário (tudo texto, como nos campos) ----------

interface Valores {
  nome: string
  chamada: string
  tipo: string
  finalidade: string
  situacao: string
  mcmv: boolean
  preco: string
  areaMin: string
  areaMax: string
  quartosMin: string
  quartosMax: string
  suites: string
  banheirosMin: string
  banheirosMax: string
  vagasMin: string
  vagasMax: string
  entregaMes: string
  entregaAno: string
  unidades: string
  construtora: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  descricao: string
  lazer: string
  proximidades: string
  fotos: string[]
  /** Foto dos cards (src). Vazio ou fora da lista: vale a primeira. */
  capa: string
}

const numeroBr = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const formatar = (n: number | undefined) => (n === undefined ? '' : numeroBr.format(n))

function valoresDe(im: Imovel): Valores {
  const [ano = '', mes = ''] = im.entrega?.split('-') ?? []
  return {
    nome: im.nome,
    chamada: im.chamada,
    tipo: im.tipo,
    finalidade: im.finalidade,
    situacao: im.situacao,
    mcmv: im.mcmv,
    preco: im.preco ? formatar(im.preco) : '',
    areaMin: im.area.min ? formatar(im.area.min) : '',
    areaMax: im.area.max ? formatar(im.area.max) : '',
    quartosMin: im.quartos.max ? formatar(im.quartos.min) : '',
    quartosMax: im.quartos.max ? formatar(im.quartos.max) : '',
    suites: formatar(im.suites),
    banheirosMin: im.banheiros.max ? formatar(im.banheiros.min) : '',
    banheirosMax: im.banheiros.max ? formatar(im.banheiros.max) : '',
    vagasMin: formatar(im.vagas?.min),
    vagasMax: formatar(im.vagas?.max),
    entregaMes: mes,
    entregaAno: ano,
    unidades: im.unidades ?? '',
    construtora: im.construtora ?? '',
    logradouro: im.local.logradouro ?? '',
    bairro: im.local.bairro,
    cidade: im.local.cidade,
    uf: im.local.uf,
    descricao: im.descricao.join('\n'),
    lazer: im.lazer.join('\n'),
    proximidades: im.proximidades.join('\n'),
    fotos: im.fotos.map((f) => f.src),
    capa: (im.capa ?? im.fotos[0])?.src ?? '',
  }
}

/** Ponto de partida do cadastro: escolhas comuns já marcadas, o resto em branco. */
const IMOVEL_VAZIO: Imovel = {
  id: '',
  codigo: '',
  slug: '',
  nome: '',
  tipo: 'apartamento',
  finalidade: 'venda',
  situacao: 'lancamento',
  local: { bairro: '', bairroSlug: '', cidade: '', cidadeSlug: '', uf: 'PE' },
  preco: 0,
  area: { min: 0, max: 0 },
  quartos: { min: 0, max: 0 },
  banheiros: { min: 0, max: 0 },
  vagas: null,
  mcmv: false,
  destaque: false,
  publicadoEm: '',
  atualizadoEm: '',
  chamada: '',
  descricao: [],
  fotos: [],
  plantas: [],
  lazer: [],
  proximidades: [],
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const ANO_ATUAL = new Date().getFullYear()

function opcoesAno(atual: string) {
  const anos = Array.from({ length: 13 }, (_, i) => String(ANO_ATUAL - 2 + i))
  if (atual && !anos.includes(atual)) anos.unshift(atual)
  return [{ valor: '', rotulo: 'Ano' }, ...anos.map((a) => ({ valor: a, rotulo: a }))]
}

const OPCOES_MES = [{ valor: '', rotulo: 'Sem previsão' }, ...MESES.map((m, i) => ({ valor: String(i + 1).padStart(2, '0'), rotulo: m }))]

const contarLinhas = (texto: string) => texto.split('\n').filter((l) => l.trim()).length
const itens = (n: number) => `${n} ${n === 1 ? 'item' : 'itens'}`

/** Faixa para a prévia do card; se o campo estiver incompleto, usa o valor salvo. */
function faixaPrevia(min: string, max: string, salvo: Faixa): Faixa {
  const a = lerNumeroBr(min)
  const b = lerNumeroBr(max) ?? a
  return a === undefined || b === undefined || Number.isNaN(a) || Number.isNaN(b) ? salvo : { min: a, max: Math.max(a, b) }
}

// ---------- Campos ----------

function Campo({
  texto,
  campo,
  erros,
  dica,
  extra,
  className,
  children,
}: {
  texto: string
  campo: string
  erros?: EstadoFormulario['erros']
  dica?: ReactNode
  extra?: ReactNode
  className?: string
  children: ReactNode
}) {
  const erro = erros?.[campo]
  return (
    <label className={`${s.rotulo} ${className ?? ''}`}>
      <span>
        {texto}
        {extra && <span className={s.dica}> · {extra}</span>}
      </span>
      {children}
      {dica && <span className={s.dica}>{dica}</span>}
      {erro && (
        <span className="erro-campo" id={`erro-${campo}`}>
          {erro}
        </span>
      )}
    </label>
  )
}

const invalido = (erros: EstadoFormulario['erros'], campo: string) =>
  erros?.[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `erro-${campo}` } : {}

// ---------- Fotos ----------

function EditorFotos({
  fotos,
  capa,
  mudar,
  escolherCapa,
  nome,
  erro,
}: {
  fotos: string[]
  /** Capa já resolvida: sempre uma das fotos da lista. */
  capa: string
  mudar: (atualizar: (fotos: string[]) => string[]) => void
  escolherCapa: (src: string) => void
  nome: string
  erro?: string
}) {
  const avisar = useAvisar()
  const [enviando, setEnviando] = useState(0)
  const entrada = useRef<HTMLInputElement>(null)

  const mover = (de: number, para: number) =>
    mudar((lista) => {
      const copia = [...lista]
      const [foto] = copia.splice(de, 1)
      copia.splice(para, 0, foto!)
      return copia
    })

  async function enviar(arquivos: File[]) {
    setEnviando(arquivos.length)
    const novas: string[] = []
    // Uma por vez: cada foto de celular já tem alguns MB.
    for (const arquivo of arquivos) {
      const dados = new FormData()
      dados.append('foto', arquivo)
      try {
        const resposta = await fetch('/admin/enviar-foto', { method: 'POST', body: dados })
        const json = (await resposta.json()) as { src?: string; erro?: string }
        if (json.src) novas.push(json.src)
        else avisar(json.erro ?? 'Não foi possível enviar a foto.', { erro: true })
      } catch {
        avisar(`Falha de conexão ao enviar ${arquivo.name}.`, { erro: true })
      }
      setEnviando((n) => n - 1)
    }
    if (novas.length) {
      mudar((lista) => [...lista, ...novas])
      avisar(novas.length === 1 ? 'Foto enviada. Salve para publicar no site.' : `${novas.length} fotos enviadas. Salve para publicar no site.`)
    }
  }

  return (
    <>
      {fotos.map((src) => (
        <input key={src} type="hidden" name="fotos" value={src} />
      ))}
      <input type="hidden" name="capa" value={capa} />
      <ul className={s.fotos}>
        {fotos.map((src, i) => (
          <li key={src} className={s.foto} data-capa={src === capa || undefined}>
            <div className={s.fotoImagem}>
              <Image loader={carregadorImagem} src={src} alt={`${nome} – foto ${i + 1}`} fill sizes="(max-width: 767px) 50vw, 220px" />
              {src === capa && <span className={s.fotoCapa}>Capa</span>}
              <span className={s.fotoNumero}>{i + 1}</span>
            </div>
            <div className={s.fotoBotoes}>
              <button type="button" className={s.quadrado} onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label={`Mover foto ${i + 1} para a esquerda`}>
                <Icone nome="seta-esquerda" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={s.quadrado}
                onClick={() => escolherCapa(src)}
                disabled={src === capa}
                aria-label={src === capa ? `Foto ${i + 1} é a capa` : `Usar foto ${i + 1} como capa`}
                title={src === capa ? 'Esta é a capa' : 'Usar como capa'}
              >
                <Icone nome="estrela" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={s.quadrado}
                onClick={() => mover(i, i + 1)}
                disabled={i === fotos.length - 1}
                aria-label={`Mover foto ${i + 1} para a direita`}
              >
                <Icone nome="seta" tamanho={16} espessura={2} />
              </button>
              <button
                type="button"
                className={`${s.quadrado} ${s.quadradoPerigo}`}
                disabled={fotos.length === 1}
                aria-label={`Remover foto ${i + 1}`}
                title={fotos.length === 1 ? 'O imóvel precisa de pelo menos uma foto' : 'Remover'}
                onClick={() => {
                  const antes = fotos
                  mudar((lista) => lista.filter((f) => f !== src))
                  avisar('Foto removida.', { desfazer: () => mudar(() => antes) })
                }}
              >
                <Icone nome="fechar" tamanho={16} espessura={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          const arquivos = [...(e.target.files ?? [])]
          e.target.value = ''
          if (arquivos.length) enviar(arquivos)
        }}
      />
      <button type="button" className={s.enviarFotos} onClick={() => entrada.current?.click()} disabled={enviando > 0}>
        <span className={s.enviarFotosIcone}>
          <Icone nome="enviar" tamanho={22} espessura={2} />
        </span>
        <span>
          <strong>{enviando ? `Enviando ${enviando === 1 ? '1 foto' : `${enviando} fotos`}…` : 'Enviar fotos'}</strong>
          <span>Da galeria ou da câmera. JPG, PNG ou WebP, até 15 MB.</span>
        </span>
      </button>
      {erro && (
        <span className="erro-campo" id="erro-fotos">
          {erro}
        </span>
      )}
    </>
  )
}

// ---------- Publicação (situação no site e ações) ----------

const SITUACAO_SITE: Record<StatusImovel, string> = {
  ativo: 'Publicado no site',
  inativo: 'Desativado',
  excluido: 'Excluído',
}

export function Publicacao({ imovel: im, status, editado, criado = false }: { imovel: Imovel; status: StatusImovel; editado: boolean; criado?: boolean }) {
  const { executar, pendente } = useMudarStatus()
  const avisar = useAvisar()
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)
  const [voltando, iniciar] = useTransition()

  return (
    <>
      <dl className={s.dados}>
        <div>
          <dt>Situação</dt>
          <dd>
            <span className={s.ponto} data-status={status} aria-hidden="true" />
            {SITUACAO_SITE[status]}
          </dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{criado ? 'Cadastrado no painel' : editado ? 'CRM + edições do painel' : 'Igual ao CRM'}</dd>
        </div>
        <div>
          <dt>{criado ? 'Código' : 'Código no CRM'}</dt>
          <dd>{im.codigo}</dd>
        </div>
        <div className={s.dadosBloco}>
          <dt>Endereço da página</dt>
          <dd className={s.endereco}>{urlImovel(im.slug)}</dd>
        </div>
      </dl>

      <div className={s.publicacaoAcoes}>
        {status === 'excluido' ? (
          <button type="button" className={`${s.botao} ${s.botaoSol}`} disabled={pendente} onClick={() => executar(im.id, im.nome, 'restaurar')}>
            <Icone nome="restaurar" tamanho={16} /> Restaurar
          </button>
        ) : (
          <>
            {status === 'ativo' ? (
              <button type="button" className={`${s.botao} ${s.botaoLinha}`} disabled={pendente} onClick={() => executar(im.id, im.nome, 'desativar')}>
                <Icone nome="olho-fechado" tamanho={16} /> Desativar
              </button>
            ) : (
              <button type="button" className={`${s.botao} ${s.botaoSol}`} disabled={pendente} onClick={() => executar(im.id, im.nome, 'ativar')}>
                <Icone nome="olho" tamanho={16} /> Reativar
              </button>
            )}
            <button
              type="button"
              className={`${s.botao} ${s.botaoPerigo}`}
              disabled={pendente}
              onClick={() =>
                setPedido({
                  titulo: `Excluir ${im.nome}?`,
                  texto: TEXTO_EXCLUSAO,
                  rotulo: 'Excluir imóvel',
                  aoConfirmar: () => executar(im.id, im.nome, 'excluir'),
                })
              }
            >
              <Icone nome="lixeira" tamanho={16} /> Excluir
            </button>
          </>
        )}
      </div>

      {editado && status !== 'excluido' && (
        <div className={s.voltarCrm}>
          <p>Os campos editados aqui têm prioridade sobre o CRM, mesmo quando o catálogo é importado de novo. Os demais continuam seguindo o CRM.</p>
          <button
            type="button"
            className={`${s.botao} ${s.botaoLinha}`}
            disabled={voltando}
            onClick={() =>
              setPedido({
                titulo: 'Voltar aos dados do CRM?',
                texto: 'Todas as edições feitas no painel para este imóvel serão apagadas e o site volta a mostrar os dados do CRM.',
                rotulo: 'Apagar edições',
                icone: 'restaurar',
                aoConfirmar: () =>
                  iniciar(async () => {
                    await descartarEdicoes(im.id)
                    avisar('Edições apagadas. O imóvel voltou a seguir o CRM.')
                  }),
              })
            }
          >
            <Icone nome="restaurar" tamanho={16} /> {voltando ? 'Voltando…' : 'Voltar aos dados do CRM'}
          </button>
        </div>
      )}

      <Confirmacao pedido={pedido} aoFechar={() => setPedido(null)} />
    </>
  )
}

// ---------- Formulário ----------

export function FormularioImovel({
  imovel,
  status = 'ativo',
  editado = false,
  criado = false,
}: {
  /** Ausente: formulário de cadastro de um imóvel novo. */
  imovel?: Imovel
  status?: StatusImovel
  editado?: boolean
  criado?: boolean
}) {
  const novo = !imovel
  const im = imovel ?? IMOVEL_VAZIO
  const avisar = useAvisar()
  const formulario = useRef<HTMLFormElement>(null)
  const [estado, setEstado] = useState<EstadoFormulario>(ESTADO_INICIAL)
  const [salvando, iniciar] = useTransition()
  const [publicado, setPublicado] = useState(false)

  const [inicial, setInicial] = useState(() => valoresDe(im))
  const [v, setV] = useState(inicial)
  // Quando os dados mudam no servidor (salvou ou voltou ao CRM), os campos acompanham.
  const [anterior, setAnterior] = useState(im)
  if (anterior !== im && JSON.stringify(anterior) !== JSON.stringify(im)) {
    const novos = valoresDe(im)
    setAnterior(im)
    setInicial(novos)
    setV(novos)
  }

  const sujo = JSON.stringify(v) !== JSON.stringify(inicial)
  const mudar = <C extends keyof Valores>(campo: C, valor: Valores[C]) => setV((atual) => ({ ...atual, [campo]: valor }))
  const texto = (campo: keyof Valores) => ({
    name: campo,
    value: v[campo] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => mudar(campo, e.target.value),
  })
  const erros = estado.erros

  // Avisa antes de fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!sujo) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [sujo])

  const aluguel = v.finalidade === 'aluguel'
  const entrega = v.entregaMes || v.entregaAno ? `${v.entregaAno}-${v.entregaMes}` : ''

  // A capa pode ser qualquer foto da lista; se a escolhida saiu, vale a primeira.
  const capa = v.fotos.includes(v.capa) ? v.capa : (v.fotos[0] ?? '')
  const previa: ImovelResumo | null = v.fotos[0]
    ? {
        id: im.id,
        codigo: im.codigo,
        slug: im.slug,
        nome: v.nome || 'Sem nome',
        tipo: TIPOS.find((t) => t === v.tipo) ?? im.tipo,
        finalidade: aluguel ? 'aluguel' : 'venda',
        situacao: SITUACOES.find((st) => st === v.situacao) ?? im.situacao,
        local: { bairro: v.bairro, cidade: v.cidade },
        preco: lerNumeroBr(v.preco) || 0,
        area: faixaPrevia(v.areaMin, v.areaMax, im.area),
        quartos: faixaPrevia(v.quartosMin, v.quartosMax, im.quartos),
        banheiros: faixaPrevia(v.banheirosMin, v.banheirosMax, im.banheiros),
        vagas: v.vagasMin ? faixaPrevia(v.vagasMin, v.vagasMax, im.vagas ?? { min: 0, max: 0 }) : null,
        entrega: /^\d{4}-\d{2}$/.test(entrega) ? entrega : undefined,
        capa: { src: capa, width: 1600, height: 1200, alt: '' },
      }
    : null

  function salvar() {
    const form = formulario.current
    if (!form) return
    const dados = new FormData(form)
    iniciar(async () => {
      let resultado: EstadoFormulario
      try {
        resultado = novo ? await criarImovel(ESTADO_INICIAL, dados) : await salvarImovel(im.id, ESTADO_INICIAL, dados)
      } catch {
        avisar('Não foi possível salvar. Confira a conexão e tente de novo.', { erro: true })
        return
      }
      setEstado(resultado)
      if (resultado.status === 'sucesso') {
        setPublicado(true)
        if (!novo) avisar(status === 'ativo' ? 'Alterações publicadas no site.' : 'Alterações salvas.')
      } else {
        avisar(resultado.mensagem ?? 'Confira os campos destacados.', { erro: true })
        requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      }
    })
  }

  const estadoTexto = novo
    ? sujo
      ? 'O imóvel só vai ao site depois de cadastrado.'
      : 'Preencha os dados do imóvel para cadastrá-lo.'
    : sujo
    ? 'Você tem alterações que ainda não estão no site.'
    : status === 'inativo'
      ? 'Imóvel desativado: as alterações ficam guardadas para quando ele voltar ao site.'
      : publicado
        ? 'Alterações publicadas. O site já mostra a versão nova.'
        : 'Tudo salvo. Esta é a versão que está no site.'

  return (
    <>
      <div className={`container ${s.corpo}`} data-estreito>
        <form
          ref={formulario}
          id="formulario-imovel"
          className={s.formulario}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            salvar()
          }}
        >
          <Secao id="apresentacao" icone={<Icone nome="texto" />} titulo="Apresentação" descricao="Aparece nos cards, no título da página e no Google.">
            <div className={s.apresentacao}>
              <div className={s.campos}>
                <Campo texto="Nome" campo="nome" erros={erros}>
                  <input className="campo" maxLength={120} required {...texto('nome')} {...invalido(erros, 'nome')} />
                </Campo>
                <Campo
                  texto="Chamada"
                  campo="chamada"
                  erros={erros}
                  extra={<span data-longo={v.chamada.length > 90 || undefined}>{v.chamada.length}/90</span>}
                  dica={v.chamada.length > 90 ? 'Acima de 90 caracteres a frase pode ser cortada nos cards.' : undefined}
                >
                  <textarea className="campo" rows={2} maxLength={200} required {...texto('chamada')} {...invalido(erros, 'chamada')} />
                </Campo>
                <Campo texto="Tipo" campo="tipo" erros={erros}>
                  <Seletor
                    name="tipo"
                    aria-label="Tipo"
                    valor={v.tipo}
                    aoMudar={(valor) => mudar('tipo', valor)}
                    opcoes={TIPOS.map((t) => ({ valor: t, rotulo: rotuloTipo[t] }))}
                  />
                </Campo>
                <div className={s.rotulo}>
                  <span id="rotulo-finalidade">Finalidade</span>
                  <input type="hidden" name="finalidade" value={v.finalidade} />
                  <div className="segmentado" role="group" aria-labelledby="rotulo-finalidade">
                    {(['venda', 'aluguel'] as const).map((f) => (
                      <button key={f} type="button" aria-pressed={v.finalidade === f} onClick={() => mudar('finalidade', f)}>
                        {f === 'venda' ? 'Venda' : 'Aluguel'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.rotulo}>
                  <span id="rotulo-situacao">Situação da obra</span>
                  <input type="hidden" name="situacao" value={v.situacao} />
                  <div className={s.chips} role="group" aria-labelledby="rotulo-situacao">
                    {SITUACOES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        className="alternancia alternancia-pilula"
                        aria-pressed={v.situacao === st}
                        onClick={() => mudar('situacao', st)}
                      >
                        {rotuloSituacao[st]}
                      </button>
                    ))}
                  </div>
                </div>
                <label className={s.mcmv}>
                  <Image src={logoMcmv} alt="" width={44} height={44} className={s.mcmvLogo} />
                  <span>
                    <strong>Minha Casa Minha Vida</strong>
                    <span>Aparece no filtro da busca e ganha o selo no card.</span>
                  </span>
                  <input
                    className={s.chave}
                    type="checkbox"
                    name="mcmv"
                    checked={v.mcmv}
                    onChange={(e) => mudar('mcmv', e.target.checked)}
                    aria-label="Elegível ao Minha Casa Minha Vida"
                  />
                </label>
              </div>

              {previa && (
                <div className={s.previa}>
                  <span className={s.legenda}>Prévia do card no site</span>
                  {/* Só para ver: o card não é clicável aqui. */}
                  <div inert>
                    <CardImovel imovel={previa} />
                  </div>
                </div>
              )}
            </div>
          </Secao>

          <Secao id="valores" icone={<Icone nome="dinheiro" />} titulo="Valores e características" descricao="Faixas com o menor e o maior valor entre as unidades.">
            <div className={s.grade}>
              <Campo
                texto={aluguel ? 'Aluguel mensal' : 'Investimento a partir de'}
                campo="preco"
                erros={erros}
                dica={aluguel ? 'Valor do aluguel por mês.' : 'Menor valor entre as unidades.'}
              >
                <span className={s.prefixo}>
                  <b>R$</b>
                  <input
                    inputMode="decimal"
                    {...texto('preco')}
                    onBlur={() => {
                      const n = lerNumeroBr(v.preco)
                      if (n !== undefined && !Number.isNaN(n)) mudar('preco', formatar(n))
                    }}
                    {...invalido(erros, 'preco')}
                  />
                </span>
              </Campo>
              <Faixa texto="Área privativa (m²)" campo="area" v={v} mudar={mudar} erros={erros} />
            </div>
            <div className={`${s.grade} ${s.grade4}`}>
              <Faixa texto="Quartos" campo="quartos" v={v} mudar={mudar} erros={erros} inteiro />
              <Campo texto="Suítes" campo="suites" erros={erros}>
                <input className="campo" inputMode="numeric" {...texto('suites')} {...invalido(erros, 'suites')} />
              </Campo>
              <Faixa texto="Banheiros" campo="banheiros" v={v} mudar={mudar} erros={erros} inteiro />
              <Faixa texto="Vagas" campo="vagas" v={v} mudar={mudar} erros={erros} inteiro />
            </div>
            <span className={s.dica}>Vagas vazias aparecem como “a consultar”. Para um valor único, repita o número ou deixe o máximo vazio.</span>
            <div className={s.grade}>
              <div className={s.rotulo}>
                <span id="rotulo-entrega">Previsão de entrega</span>
                <input type="hidden" name="entrega" value={entrega} />
                <div className={s.entrega} role="group" aria-labelledby="rotulo-entrega">
                  <Seletor aria-label="Mês da entrega" valor={v.entregaMes} aoMudar={(m) => mudar('entregaMes', m)} opcoes={OPCOES_MES} />
                  <Seletor aria-label="Ano da entrega" valor={v.entregaAno} aoMudar={(a) => mudar('entregaAno', a)} opcoes={opcoesAno(v.entregaAno)} />
                </div>
                {erros?.entrega && <span className="erro-campo">{erros.entrega}</span>}
              </div>
              <Campo texto="Unidades" campo="unidades" erros={erros}>
                <input className="campo" maxLength={120} placeholder="Ex.: 120 em 4 torres" {...texto('unidades')} />
              </Campo>
              <Campo texto="Construtora" campo="construtora" erros={erros}>
                <input className="campo" maxLength={120} placeholder="Nome da construtora" {...texto('construtora')} />
              </Campo>
            </div>
          </Secao>

          <Secao id="localizacao" icone={<Icone nome="local" />} titulo="Localização" descricao="Bairro e cidade definem em quais buscas o imóvel aparece.">
            <Campo texto="Endereço" campo="logradouro" erros={erros} dica="Vazio: o site mostra só bairro e cidade.">
              <input className="campo" maxLength={200} placeholder="Rua e número" {...texto('logradouro')} />
            </Campo>
            <div className={s.gradeLocal}>
              <Campo texto="Bairro" campo="bairro" erros={erros}>
                <input className="campo" maxLength={80} {...texto('bairro')} {...invalido(erros, 'bairro')} />
              </Campo>
              <Campo texto="Cidade" campo="cidade" erros={erros}>
                <input className="campo" maxLength={80} {...texto('cidade')} {...invalido(erros, 'cidade')} />
              </Campo>
              <Campo texto="UF" campo="uf" erros={erros}>
                <input
                  className="campo"
                  maxLength={2}
                  autoCapitalize="characters"
                  {...texto('uf')}
                  onChange={(e) => mudar('uf', e.target.value.toUpperCase())}
                  {...invalido(erros, 'uf')}
                />
              </Campo>
            </div>
            <MapaEstatico
              consulta={[v.logradouro, v.bairro, v.cidade, v.uf].filter(Boolean).join(', ')}
              legenda="Conferir no Google Maps"
              altura={170}
              className={s.mapa}
            />
          </Secao>

          <Secao id="textos" icone={<Icone nome="texto" />} titulo="Textos" descricao="Uma linha por parágrafo ou item.">
            <Campo texto="Descrição" campo="descricao" erros={erros}>
              <textarea className="campo" rows={6} {...texto('descricao')} />
            </Campo>
            <div className={s.grade}>
              <Campo texto="Itens de lazer" campo="lazer" erros={erros} extra={itens(contarLinhas(v.lazer))}>
                <textarea className="campo" rows={7} {...texto('lazer')} />
              </Campo>
              <Campo texto="Proximidades" campo="proximidades" erros={erros} extra={itens(contarLinhas(v.proximidades))}>
                <textarea className="campo" rows={7} {...texto('proximidades')} />
              </Campo>
            </div>
          </Secao>

          <Secao
            id="fotos"
            icone={<Icone nome="imagem" />}
            titulo="Fotos"
            descricao="A foto marcada como Capa aparece nos cards do site. Use a estrela para trocar a capa e as setas para reordenar a galeria."
            extra={<span className={s.secaoExtra}>{v.fotos.length === 1 ? '1 foto' : `${v.fotos.length} fotos`}</span>}
          >
            <EditorFotos
              fotos={v.fotos}
              capa={capa}
              mudar={(f) => setV((atual) => ({ ...atual, fotos: f(atual.fotos) }))}
              escolherCapa={(src) => mudar('capa', src)}
              nome={v.nome}
              erro={erros?.fotos}
            />
          </Secao>
        </form>

        {!novo && (
          <Secao id="publicacao" icone={<Icone nome="externo" />} titulo="Publicação" descricao="Situação do imóvel no site.">
            <Publicacao imovel={im} status={status} editado={editado} criado={criado} />
          </Secao>
        )}
      </div>

      <div className={s.barraSalvar} data-barra-salvar>
        <div className={s.barraSalvarConteudo}>
          <span className={s.barraEstado}>
            <span className={s.ponto} data-sujo={sujo || undefined} aria-hidden="true" />
            {estadoTexto}
          </span>
          <div className={s.barraBotoes}>
            <button
              type="button"
              className={`${s.botao} ${s.botaoLinha} ${s.botaoG}`}
              disabled={!sujo || salvando}
              onClick={() => {
                setV(inicial)
                setEstado(ESTADO_INICIAL)
                avisar(novo ? 'Formulário limpo.' : 'Alterações descartadas.')
              }}
            >
              Descartar
            </button>
            <button type="submit" form="formulario-imovel" className={`${s.botao} ${s.botaoSol} ${s.botaoG}`} disabled={!sujo || salvando}>
              <Icone nome="check" tamanho={17} espessura={2.4} />
              {salvando ? (novo ? 'Cadastrando…' : 'Salvando…') : novo ? 'Cadastrar e publicar' : status === 'ativo' ? 'Salvar e publicar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Faixa({
  texto,
  campo,
  v,
  mudar,
  erros,
  inteiro,
}: {
  texto: string
  campo: 'area' | 'quartos' | 'banheiros' | 'vagas'
  v: Valores
  mudar: (campo: keyof Valores, valor: string) => void
  erros: EstadoFormulario['erros']
  inteiro?: boolean
}) {
  const min = `${campo}Min` as const
  const max = `${campo}Max` as const
  return (
    <Campo texto={texto} campo={campo} erros={erros}>
      <span className={s.faixa} data-invalido={erros?.[campo] ? true : undefined}>
        <input
          inputMode={inteiro ? 'numeric' : 'decimal'}
          name={min}
          value={v[min]}
          onChange={(e) => mudar(min, e.target.value)}
          aria-label={`${texto} – mínimo`}
          {...invalido(erros, campo)}
        />
        <span>a</span>
        <input
          inputMode={inteiro ? 'numeric' : 'decimal'}
          name={max}
          value={v[max]}
          onChange={(e) => mudar(max, e.target.value)}
          aria-label={`${texto} – máximo`}
          {...invalido(erros, campo)}
        />
      </span>
    </Campo>
  )
}
